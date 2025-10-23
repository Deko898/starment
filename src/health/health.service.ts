import { Injectable } from '@nestjs/common';
import { env } from '@starment/config';
import { PinoLogger } from 'nestjs-pino';

import { CacheHealthIndicator } from './indicators/cache-health.indicator';
import { DatabaseHealthIndicator } from './indicators/database-health.indicator';
import { CheckStatus } from './interfaces/check-status.enum';
import { LivenessResponse } from './interfaces/liveness-response.interface';
import { ReadinessResponse } from './interfaces/readiness-response.interface';

@Injectable()
export class HealthService {
  private readonly startedAt = Date.now();

  constructor(
    private readonly databaseHealth: DatabaseHealthIndicator,
    private readonly cacheHealth: CacheHealthIndicator,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext('HealthService');
  }

  liveness(): LivenessResponse {
    return {
      status: CheckStatus.OK,
      service: env().serviceName,
      uptimeMs: Date.now() - this.startedAt,
      timestamp: new Date().toISOString(),
      env: env().nodeEnv,
    };
  }

  async readiness(): Promise<ReadinessResponse> {
    // 1) Env sanity - using our type-safe environment validation
    let envStatus: CheckStatus | string = CheckStatus.OK;
    try {
      // This will throw if required env vars are missing
      const appEnv = env();
      this.logger.info({ service: appEnv.serviceName }, 'Environment validation passed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      envStatus = `Environment validation failed: ${errorMessage}`;

      return {
        status: CheckStatus.DEGRADED,
        service: env().serviceName,
        timestamp: new Date().toISOString(),
        checks: {
          env: envStatus,
          database: CheckStatus.SKIPPED,
          cache: CheckStatus.SKIPPED,
        },
      };
    }

    // 2) Run health checks in parallel for better performance
    const [databaseStatus, cacheStatus] = await Promise.all([
      this.databaseHealth.check(),
      this.cacheHealth.check(),
    ]);

    // 3) Determine overall status
    const hasErrors =
      databaseStatus === CheckStatus.ERROR || cacheStatus === CheckStatus.ERROR;

    const hasDegradation =
      databaseStatus === CheckStatus.DEGRADED || cacheStatus === CheckStatus.DEGRADED;

    let overallStatus = CheckStatus.OK;
    if (hasErrors) {
      overallStatus = CheckStatus.ERROR;
    } else if (hasDegradation) {
      overallStatus = CheckStatus.DEGRADED;
    }

    return {
      status: overallStatus,
      service: env().serviceName,
      timestamp: new Date().toISOString(),
      checks: {
        env: envStatus,
        database: databaseStatus,
        cache: cacheStatus,
      },
    };
  }
}
