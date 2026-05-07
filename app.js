const express = require("express");

const { register } = require("./instrumentation");
const logger = require("./utils/logger");
const metricsMiddleware = require("./middleware/metricsMiddleware");
const loggerMiddleware = require("./middleware/loggerMiddleware");
const healthRouter = require("./routes/health");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(metricsMiddleware);
app.use(loggerMiddleware);

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Production monitoring service is running",
  });
});

app.use("/health", healthRouter);

app.get("/error", (req, res, next) => {
  const err = new Error("Simulated server error");
  err.statusCode = 500;
  next(err);
});

app.get("/metrics", async (req, res, next) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    next(err);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  logger.error("Request failed", {
    message: err.message,
    statusCode,
    path: req.originalUrl,
    stack: err.stack,
  });

  res.status(statusCode).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
  logger.info("Server started", { port: PORT });
});

module.exports = app;
