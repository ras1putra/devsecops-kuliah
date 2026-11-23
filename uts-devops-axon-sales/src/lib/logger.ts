export interface LogMeta {
  [key: string]: unknown;
}

function formatMeta(meta?: LogMeta): string {
  if (!meta) return "";
  const entries = Object.entries(meta).filter(
    ([k, v]) => v !== undefined && v !== null && k !== "timestamp" && k !== "level",
  );
  if (entries.length === 0) return "";
  const parts = entries.map(([k, v]) => `${k}: ${v}`);
  return ` (${parts.join(", ")})`;
}

export const logger = {
  info: (message: string, meta?: LogMeta) => {
    console.log(`[INFO] ${message}${formatMeta(meta)}`);
  },

  warn: (message: string, meta?: LogMeta) => {
    console.warn(`[WARN] ${message}${formatMeta(meta)}`);
  },

  error: (message: string, err?: unknown, meta?: LogMeta) => {
    const errDetail =
      err instanceof Error
        ? ` - error: ${err.message}`
        : err !== undefined && err !== null
        ? ` - error: ${String(err)}`
        : "";

    console.error(`[ERROR] ${message}${errDetail}${formatMeta(meta)}`);
  },
};
