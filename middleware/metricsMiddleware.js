const { metrics } = require("../instrumentation");

function resolveRouteLabel(req) {
  const routePath = req.route && req.route.path ? req.route.path : req.path;
  const baseUrl = req.baseUrl || "";

  if (!routePath) {
    return "unknown";
  }

  if (baseUrl && routePath !== "/") {
    return `${baseUrl}${routePath}`;
  }

  return baseUrl || routePath;
}

function metricsMiddleware(req, res, next) {
  const start = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(start);
    const durationSeconds = diff[0] + diff[1] / 1e9;
    const labels = {
      method: req.method,
      route: resolveRouteLabel(req),
      status_code: String(res.statusCode),
    };

    metrics.httpRequestsTotal.inc(labels);
    metrics.httpRequestDurationSeconds.observe(labels, durationSeconds);

    if (res.statusCode >= 500) {
      metrics.httpErrorsTotal.inc(labels);
    }
  });

  next();
}

module.exports = metricsMiddleware;
