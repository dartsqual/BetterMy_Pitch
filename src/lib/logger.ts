import pino from "pino";

// JSON logs on stdout. When the Datadog tracer is active (DD_LOGS_INJECTION),
// dd-trace adds trace/span ids so logs link to APM traces.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: process.env.DD_SERVICE ?? "bettermy-pitch" },
  formatters: { level: (label) => ({ level: label }) },
  timestamp: pino.stdTimeFunctions.isoTime,
});
