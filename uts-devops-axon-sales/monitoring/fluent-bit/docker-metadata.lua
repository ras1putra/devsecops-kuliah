local name_cache = {}

-- Target containers: Backend Next.js App and Backend HTTP Request Logs (Nginx)
local target_containers = {
    ["axon-app-prod"] = true,
    ["axon-nginx-prod"] = true
}

-- Accurately detect log level avoiding false positives
local function detect_log_level(msg)
    local lower = msg:lower()

    -- klog format (Google/Kubernetes/cAdvisor): I=Info, W=Warning, E=Error, F=Fatal
    if msg:match("^[I]%d%d%d%d") then
        return "info"
    elseif msg:match("^[W]%d%d%d%d") then
        return "warn"
    elseif msg:match("^[EF]%d%d%d%d") then
        return "error"
    end

    -- Structured logfmt & JSON: level=... or "level":"..."
    if lower:match('level="?error"?') or lower:match('level="?fatal"?') or lower:match('level="?panic"?') then
        return "error"
    elseif lower:match('level="?warn') then
        return "warn"
    elseif lower:match('level="?info"?') or lower:match('level="?debug"?') or lower:match('level="?trace"?') then
        return "info"
    end

    -- Bracketed tags: [error], [ERROR], [warn], [WARNING], [info], [Note] (MySQL/Nginx)
    if lower:match("%[error%]") or lower:match("%[fatal%]") or lower:match("%[crit%]") or lower:match("%[emerg%]") then
        return "error"
    elseif lower:match("%[warn") then
        return "warn"
    elseif lower:match("%[info%]") or lower:match("%[note%]") or lower:match("%[notice%]") then
        return "info"
    end

    -- HTTP status codes for Nginx access logs (e.g. 500 or 404)
    if msg:match('" %s*5%d%d %s*') then
        return "error"
    elseif msg:match('" %s*4%d%d %s*') then
        return "warn"
    elseif msg:match('" %s*[123]%d%d %s*') then
        return "info"
    end

    -- Explicit line prefixes or fatal exceptions
    if lower:match("^error%s*:") or lower:match("^fatal%s*:") or lower:match("^panic%s*:") or lower:match("uncaughtexception") then
        return "error"
    elseif lower:match("^warn") then
        return "warn"
    end

    -- Default fallback
    return "info"
end

function process_docker_log(tag, timestamp, record)
    local filepath = record["filepath"]
    if not filepath then
        return 0, timestamp, record
    end

    -- Extract 64-character container ID from filepath
    local container_id = filepath:match("/var/lib/docker/containers/([^/]+)/")
    if not container_id then
        return 0, timestamp, record
    end

    local container_name = name_cache[container_id]
    if not container_name then
        local config_file = "/var/lib/docker/containers/" .. container_id .. "/config.v2.json"
        local f = io.open(config_file, "r")
        if f then
            local content = f:read("*all")
            f:close()
            local name = content:match('"Name"%s*:%s*"([^"]+)"')
            if name then
                container_name = name:gsub("^/", "")
                name_cache[container_id] = container_name
            end
        end
    end

    -- Accept only core application containers (drop cadvisor, grafana, exporters to keep logs clean)
    if not container_name or not target_containers[container_name] then
        return -1, timestamp, record
    end

    local raw_log = record["log"] or ""
    raw_log = raw_log:gsub("[\r\n]+$", "")

    -- Drop internal Grafana UI/API polling and favicon noise from Nginx
    if container_name == "axon-nginx-prod" and (raw_log:match("/grafana/") or raw_log:match("/favicon%.ico")) then
        return -1, timestamp, record
    end

    local level = detect_log_level(raw_log)


    local minimal_record = {
        container = container_name,
        level = level,
        message = raw_log
    }

    return 2, timestamp, minimal_record

end
