# High Error Rate Alert Runbook

## Alert Meaning

The service is returning an elevated percentage of 5xx responses. This indicates the API is failing to serve requests successfully and requires investigation.

## Possible Causes

- Downstream dependency failures (database, cache, external API).
- Application instability (memory leak, unhandled exceptions).
- Sudden traffic spike causing resource exhaustion.
- Recent deploy introduced regressions.

## Diagnosis Steps

1. Check Grafana dashboards for error rate, latency, CPU, and memory trends.
2. Review logs for recent error spikes and repeated failure messages.
3. Correlate timestamps with deployments or infrastructure changes.
4. Validate dependency health (DB, cache, external services).
5. Verify system resources on the host/container (CPU, memory, file descriptors).

## Recovery Actions

- Roll back the latest deployment if errors started immediately after a release.
- Restart the service to clear transient faults or memory pressure.
- Scale the service horizontally if resource saturation is observed.
- Mitigate traffic spikes with rate limiting or upstream throttling.
- Fail open or serve degraded responses if the dependency is unavailable.

## Escalation Guidance

- Escalate to the owning team if errors persist for more than 15 minutes or if data loss is suspected.
- Escalate to database or platform teams for dependency-specific outages.
- Declare an incident if error rate exceeds 20% for more than 5 minutes.

---

## Failure Mode 1: Database Failure

### Symptoms

- High 5xx error rate.
- Latency spikes on endpoints that depend on database calls.
- Connection-related error logs (timeouts, connection refused).

### How to Diagnose

- Check logs for connection timeout or authentication errors.
- Verify database health dashboard and connectivity from the service host.
- Look for increases in `http_errors_total` on DB-dependent routes.

### Expected Grafana Signals

- Error rate panel spikes for specific routes.
- Latency panel p95/p99 increases.
- CPU stable but request failures increase.

### Relevant Logs

- Messages including "ECONNREFUSED", "ETIMEDOUT", or database client errors.

### Possible Fixes

- Failover to a replica or restore connectivity.
- Increase connection pool limits if saturated.
- Temporarily disable a feature that requires the database.

---

## Failure Mode 2: Memory Leak

### Symptoms

- Gradual increase in memory usage over time.
- Elevated GC activity and increased response latency.
- Process restarts or OOM kills.

### How to Diagnose

- Check `process_resident_memory_bytes` and `process_heap_used_bytes`.
- Inspect logs for out-of-memory errors or restarts.
- Compare memory growth with traffic patterns.

### Expected Grafana Signals

- Memory usage panel steadily rising without dropping.
- Latency increases under sustained load.
- Error rate spikes when memory becomes constrained.

### Relevant Logs

- "JavaScript heap out of memory" or termination messages from the runtime.

### Possible Fixes

- Restart the service to stabilize temporarily.
- Identify memory-heavy endpoints and disable non-critical features.
- Add heap snapshots in a staging environment to locate leaks.

---

## Failure Mode 3: Traffic Spike

### Symptoms

- Sudden jump in requests/sec.
- Increased latency and error rate under load.
- CPU usage near saturation.

### How to Diagnose

- Check requests/sec panel for a sharp increase.
- Review access logs for spikes in a single route or client.
- Confirm upstream load balancer or gateway metrics.

### Expected Grafana Signals

- Requests/sec panel spikes.
- CPU usage climbs sharply.
- Latency p95 increases; error rate follows.

### Relevant Logs

- High volume of "HTTP request" logs in a short period.

### Possible Fixes

- Scale out the service or increase resources temporarily.
- Enable rate limiting or traffic shaping upstream.
- Cache responses for hot endpoints to reduce load.
