const logger = require("../utils/logger");

function loggerMiddleware(req, res, next) {
  const start = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(start);
    const durationMs = Math.round(diff[0] * 1e3 + diff[1] / 1e6);

    logger.info("HTTP request", {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      userAgent: req.get("user-agent"),
    });
  });

  next();
}

module.exports = loggerMiddleware;
