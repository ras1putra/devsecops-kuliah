import client from "prom-client";

const globalForMetrics = globalThis as unknown as {
  metricsRegistry?: client.Registry;
  httpRequestsTotal?: client.Counter<string>;
  httpRequestDurationSeconds?: client.Histogram<string>;
};

export const register =
  globalForMetrics.metricsRegistry ?? new client.Registry();

if (!globalForMetrics.metricsRegistry) {
  client.collectDefaultMetrics({
    register,
    prefix: "axon_",
  });
  globalForMetrics.metricsRegistry = register;
}

export const httpRequestsTotal =
  globalForMetrics.httpRequestsTotal ??
  new client.Counter({
    name: "axon_http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status"],
    registers: [register],
  });
globalForMetrics.httpRequestsTotal = httpRequestsTotal;

export const httpRequestDurationSeconds =
  globalForMetrics.httpRequestDurationSeconds ??
  new client.Histogram({
    name: "axon_http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status"],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    registers: [register],
  });
globalForMetrics.httpRequestDurationSeconds = httpRequestDurationSeconds;
