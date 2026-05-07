# Production Monitoring Service

## Overview

This project is a production-style Express service with structured logging, Prometheus metrics, and guidance for Grafana dashboards and Alertmanager integration. It focuses on clean instrumentation and practical operational workflows.

## Observability Architecture

- Logs: JSON logs via Winston (console + file), with request and error context.
- Metrics: Prometheus metrics via `prom-client` exposed at `/metrics`.
- Dashboards: Grafana panels built on PromQL queries listed below.
- Alerts: High error rate alerting based on `http_errors_total` and `http_requests_total`.

## Setup (No Docker/YAML)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the service:
   ```bash
   npm start
   ```

### Environment Variables

- `PORT`: Port to bind the server (default: 3000).
- `LOG_LEVEL`: Winston log level (default: info).

## Endpoints

- `GET /` - Basic success response.
- `GET /health` - Health status JSON.
- `GET /error` - Simulated 500 error (failure testing).
- `GET /metrics` - Prometheus metrics scrape endpoint.

## Metrics

### Custom Metrics

- `http_requests_total{method,route,status_code}`
- `http_errors_total{method,route,status_code}`
- `http_request_duration_seconds{method,route,status_code}` (Histogram)

### Default Metrics

`prom-client` exports Node.js runtime metrics such as CPU and memory usage, GC, and event loop stats.

## Traffic Simulation

Basic calls:

```bash
curl http://localhost:3000/
curl http://localhost:3000/health
curl http://localhost:3000/error
```

Burst traffic (bash):

```bash
for i in {1..100}; do curl -s http://localhost:3000/ > /dev/null; done
```

Error burst (bash):

```bash
for i in {1..100}; do curl -s http://localhost:3000/error > /dev/null; done
```

PowerShell equivalents:

```powershell
1..100 | ForEach-Object { Invoke-WebRequest -UseBasicParsing http://localhost:3000/ | Out-Null }
1..100 | ForEach-Object { Invoke-WebRequest -UseBasicParsing http://localhost:3000/error | Out-Null }
```

## Grafana Dashboard Guidance

Create panels with these queries and use labels like `route` and `method` to break down traffic.

| Panel Title  | PromQL Query                                                                                    | What It Diagnoses                       |
| ------------ | ----------------------------------------------------------------------------------------------- | --------------------------------------- |
| Requests/sec | `sum(rate(http_requests_total[1m])) by (route, method)`                                         | Traffic volume and hot routes.          |
| Errors/sec   | `sum(rate(http_errors_total[1m])) by (route, method)`                                           | Error spikes and failing endpoints.     |
| Error %      | `100 * sum(rate(http_errors_total[5m])) / clamp_min(sum(rate(http_requests_total[5m])), 1)`     | Overall reliability trend.              |
| Latency p95  | `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))`  | Slow endpoints and tail latency issues. |
| CPU Usage    | `100 * (rate(process_cpu_user_seconds_total[5m]) + rate(process_cpu_system_seconds_total[5m]))` | CPU saturation and load pressure.       |
| Memory Usage | `process_resident_memory_bytes`                                                                 | Memory growth, leaks, and pressure.     |

## Alert Explanation

A high error rate alert typically fires when the percentage of `http_errors_total` exceeds a threshold (for example 5% over 5 minutes). Pair this with latency and resource panels to determine whether the issue is downstream dependency failure, resource exhaustion, or bad deploy.

## How This Observability Stack Works

- Logs capture structured request and error details, enabling fast root cause analysis.
- Metrics provide quantitative signals for rate, error, and latency trends.
- Dashboards visualize service health and highlight anomalies.
- Alerts notify on-call engineers when thresholds are breached.
- The runbook provides a consistent response workflow to reduce MTTR.

## Runbook

See [runbook.md](runbook.md) for the high error rate alert workflow and failure mode guidance.

## Testing Guidance

1. Call `/` and `/health` and confirm `200` responses.
2. Call `/error` and confirm a `500` response.
3. Inspect `/metrics` and verify counters and histogram samples.
4. Tail logs to confirm JSON output and error logging in `logs/error.log`.
