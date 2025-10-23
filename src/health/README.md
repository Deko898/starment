# Health Check Module

Comprehensive health monitoring for Starment API with liveness and readiness probes.

## Problem

Kubernetes and cloud platforms need to know:
1. **Is the application alive?** (Liveness) - Should it be restarted?
2. **Is the application ready?** (Readiness) - Should it receive traffic?

Without proper health checks:
- ❌ Kubernetes routes traffic to unhealthy pods
- ❌ Deployments fail silently
- ❌ Database connection issues go undetected
- ❌ Cache failures cause unexpected behavior

---

## Solution

**Two endpoints following Kubernetes best practices:**

1. **`/healthz`** (Liveness) - Basic application health
2. **`/readyz`** (Readiness) - Dependency health (DB, cache, etc.)

---

## Endpoints

### 1. Liveness Probe (`GET /healthz`)

**Purpose:** Check if the application process is alive and should not be restarted.

**Checks:**
- ✅ Process is running
- ✅ Uptime tracking
- ✅ Environment loaded

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "starment-api",
  "uptimeMs": 123456,
  "timestamp": "2025-10-23T10:30:00.000Z",
  "env": "production"
}
```

**Use case:** Kubernetes liveness probe
```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
```

---

### 2. Readiness Probe (`GET /readyz`)

**Purpose:** Check if the application is ready to serve traffic (all dependencies healthy).

**Checks:**
- ✅ Environment configuration
- ✅ Database (Supabase) connectivity
- ✅ Cache (Redis) connectivity

**Response - Healthy (200 OK):**
```json
{
  "status": "ok",
  "service": "starment-api",
  "timestamp": "2025-10-23T10:30:00.000Z",
  "checks": {
    "env": "ok",
    "database": "ok",
    "cache": "ok"
  }
}
```

**Response - Degraded (200 OK but degraded):**
```json
{
  "status": "degraded",
  "service": "starment-api",
  "timestamp": "2025-10-23T10:30:00.000Z",
  "checks": {
    "env": "ok",
    "database": "ok",
    "cache": "error"
  }
}
```

**Response - Error (503 Service Unavailable):**
```json
{
  "status": "error",
  "service": "starment-api",
  "timestamp": "2025-10-23T10:30:00.000Z",
  "checks": {
    "env": "ok",
    "database": "error",
    "cache": "error"
  }
}
```

**Use case:** Kubernetes readiness probe
```yaml
readinessProbe:
  httpGet:
    path: /readyz
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

---

## Health Indicators

### DatabaseHealthIndicator

**Purpose:** Verify database connectivity

**How it works:**
1. Executes lightweight query: `SELECT * FROM health_check LIMIT 1`
2. Uses existing `HealthRepository` (follows Starment patterns)
3. Logs success/failure

**Status:**
- `ok` - Query successful
- `error` - Query failed or threw exception

**File:** `src/health/indicators/database-health.indicator.ts`

---

### CacheHealthIndicator

**Purpose:** Verify Redis connectivity and functionality

**How it works:**
1. Writes test value: `health:check:ping = "ping-{timestamp}"`
2. Reads value back
3. Deletes test value (cleanup)
4. Compares read value to written value

**Status:**
- `ok` - Write/read/delete cycle successful and values match
- `degraded` - Cycle completed but values don't match
- `error` - Operation failed or threw exception

**File:** `src/health/indicators/cache-health.indicator.ts`

---

## Status Values

```typescript
enum CheckStatus {
  OK = 'ok',           // Everything working
  DEGRADED = 'degraded', // Partial functionality
  ERROR = 'error',     // Service unavailable
  SKIPPED = 'skipped'  // Check was skipped (e.g., env check failed)
}
```

**Overall Status Logic:**
- Any check is `error` → Overall status is `error`
- Any check is `degraded` → Overall status is `degraded`
- All checks are `ok` → Overall status is `ok`

---

## Kubernetes Configuration

### Complete Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: starment-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: starment/api:latest
        ports:
        - containerPort: 3000

        # Liveness: Restart if dead
        livenessProbe:
          httpGet:
            path: /healthz
            port: 3000
          initialDelaySeconds: 30  # Wait 30s after start
          periodSeconds: 10         # Check every 10s
          timeoutSeconds: 5         # Timeout after 5s
          failureThreshold: 3       # Restart after 3 failures

        # Readiness: Remove from load balancer if not ready
        readinessProbe:
          httpGet:
            path: /readyz
            port: 3000
          initialDelaySeconds: 10  # Wait 10s after start
          periodSeconds: 5          # Check every 5s
          timeoutSeconds: 3         # Timeout after 3s
          failureThreshold: 2       # Remove after 2 failures
          successThreshold: 1       # Add back after 1 success
```

---

## Monitoring & Alerts

### Prometheus Metrics

Health endpoints can be scraped by Prometheus:

```yaml
scrape_configs:
  - job_name: 'starment-api-health'
    metrics_path: '/readyz'
    scrape_interval: 30s
    static_configs:
      - targets: ['starment-api:3000']
```

### Alert Rules

```yaml
groups:
  - name: starment-api
    rules:
      - alert: ServiceNotReady
        expr: up{job="starment-api-health"} == 0
        for: 1m
        annotations:
          summary: "Starment API not ready for {{ $value }} minutes"

      - alert: DatabaseUnhealthy
        expr: starment_database_health != 1
        for: 2m
        annotations:
          summary: "Database health check failing"

      - alert: CacheUnhealthy
        expr: starment_cache_health != 1
        for: 5m
        annotations:
          summary: "Cache health check failing"
```

---

## Testing

### Manual Testing

```bash
# Liveness check
curl http://localhost:3000/healthz

# Expected: {"status":"ok","service":"starment-api",...}

# Readiness check
curl http://localhost:3000/readyz

# Expected: {"status":"ok","checks":{"env":"ok","database":"ok","cache":"ok"}}
```

### E2E Tests

```typescript
describe('Health (e2e)', () => {
  it('/healthz (GET) should return liveness status', async () => {
    const response = await request(app.getHttpServer())
      .get('/healthz')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'starment-api',
    });
    expect(response.body.uptimeMs).toBeGreaterThan(0);
  });

  it('/readyz (GET) should return readiness status', async () => {
    const response = await request(app.getHttpServer())
      .get('/readyz')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      checks: {
        env: 'ok',
        database: 'ok',
        cache: 'ok',
      },
    });
  });

  it('/readyz (GET) should detect database failure', async () => {
    // Simulate database failure
    await stopDatabase();

    const response = await request(app.getHttpServer())
      .get('/readyz')
      .expect(200); // Still returns 200, but status is 'error'

    expect(response.body.status).toBe('error');
    expect(response.body.checks.database).toBe('error');
  });
});
```

---

## Performance

**Overhead per check:**

| Check | Time | Notes |
|-------|------|-------|
| Liveness | <1ms | In-memory only |
| Env validation | ~2ms | Config check |
| Database check | ~10-30ms | Lightweight query |
| Cache check | ~5-15ms | Write/read/delete cycle |
| **Total readiness** | ~20-50ms | Checks run in parallel |

**Optimization:**
- Health checks run in parallel using `Promise.all()`
- Database query is lightweight (`LIMIT 1`)
- Cache operation has 10s TTL and is cleaned up

---

## Adding New Health Checks

### 1. Create Health Indicator

```typescript
// src/health/indicators/queue-health.indicator.ts
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { CheckStatus } from '../interfaces/check-status.enum';

@Injectable()
export class QueueHealthIndicator {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext('QueueHealthIndicator');
  }

  async check(): Promise<CheckStatus> {
    try {
      // Perform queue health check
      const isHealthy = await this.queueService.ping();
      return isHealthy ? CheckStatus.OK : CheckStatus.ERROR;
    } catch (error) {
      this.logger.error({ error }, 'Queue health check failed');
      return CheckStatus.ERROR;
    }
  }
}
```

### 2. Update Interface

```typescript
// src/health/interfaces/readiness-response.interface.ts
export interface ReadinessChecks {
  env: CheckStatus | string;
  database: CheckStatus;
  cache: CheckStatus;
  queue: CheckStatus; // ← Add this
}
```

### 3. Update Service

```typescript
// src/health/health.service.ts
constructor(
  private readonly databaseHealth: DatabaseHealthIndicator,
  private readonly cacheHealth: CacheHealthIndicator,
  private readonly queueHealth: QueueHealthIndicator, // ← Add this
  private readonly logger: PinoLogger,
) {}

async readiness(): Promise<ReadinessResponse> {
  // ...
  const [databaseStatus, cacheStatus, queueStatus] = await Promise.all([
    this.databaseHealth.check(),
    this.cacheHealth.check(),
    this.queueHealth.check(), // ← Add this
  ]);

  return {
    // ...
    checks: {
      env: envStatus,
      database: databaseStatus,
      cache: cacheStatus,
      queue: queueStatus, // ← Add this
    },
  };
}
```

### 4. Update Module

```typescript
// src/health/health.module.ts
@Module({
  providers: [
    HealthService,
    HealthRepository,
    DatabaseHealthIndicator,
    CacheHealthIndicator,
    QueueHealthIndicator, // ← Add this
  ],
})
export class HealthModule {}
```

---

## Best Practices

### 1. Keep Liveness Simple
- ✅ Should only check if the process is alive
- ❌ Don't check dependencies (database, cache, etc.)
- ❌ Don't perform heavy operations

**Why?** If database is down, you don't want Kubernetes to restart the pod. You want it to wait for the database to recover.

### 2. Readiness Should Check Dependencies
- ✅ Check all critical dependencies
- ✅ Return degraded if non-critical dependency fails
- ✅ Return error if critical dependency fails

### 3. Use Appropriate Timeouts
```yaml
livenessProbe:
  initialDelaySeconds: 30  # Wait for app to start
  periodSeconds: 10        # Check every 10s
  timeoutSeconds: 5        # Give enough time
  failureThreshold: 3      # Don't restart too quickly

readinessProbe:
  initialDelaySeconds: 10  # Shorter than liveness
  periodSeconds: 5         # Check more frequently
  timeoutSeconds: 3        # Shorter timeout
  failureThreshold: 2      # Remove from LB quickly
```

### 4. Log Health Check Failures
- Health indicators log all failures with context
- Use structured logging for easy monitoring
- Include error details for debugging

### 5. Return Quickly
- Health checks should complete in <1s
- Use timeouts on external checks
- Run checks in parallel

---

## Troubleshooting

**Pods keep restarting:**
- Check liveness probe settings (may be too aggressive)
- Increase `initialDelaySeconds` if app takes time to start
- Increase `failureThreshold` to tolerate transient failures

**Traffic not reaching healthy pods:**
- Check readiness probe response (should return 200 OK)
- Verify all dependencies are healthy
- Check if `initialDelaySeconds` is too long

**Health checks timing out:**
- Reduce number of checks or increase timeout
- Optimize database query (use simpler table)
- Check network latency to dependencies

**False positives:**
- Use circuit breakers for external dependencies
- Implement retry logic in health indicators
- Set appropriate failure thresholds

---

## Architecture

```
HealthController
  ↓
HealthService
  ├── DatabaseHealthIndicator → HealthRepository → Supabase
  └── CacheHealthIndicator → CACHE_PROVIDER → Redis
```

**Flow:**
1. HTTP request → `HealthController`
2. Controller → `HealthService.readiness()`
3. Service runs all health indicators in parallel
4. Service determines overall status
5. Response returned to client

---

## References

- [Kubernetes Liveness/Readiness Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Health Check Pattern](https://microservices.io/patterns/observability/health-check-api.html)
- [NestJS Health Checks](https://docs.nestjs.com/recipes/terminus)
