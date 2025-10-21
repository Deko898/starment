import { Injectable } from '@nestjs/common';
import { env } from '@starment/config';
import { PinoLogger } from 'nestjs-pino';

import { HealthRepository } from './health.repository';
import { CheckStatus } from './interfaces/check-status.enum';
import { LivenessResponse } from './interfaces/liveness-response.interface';
import { ReadinessResponse } from './interfaces/readiness-response.interface';

@Injectable()
export class HealthService {
  private readonly startedAt = Date.now();

  constructor(
    private readonly healthRepo: HealthRepository,
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
    try {
      // This will throw if required env vars are missing
      const appEnv = env();
      this.logger.info({ service: appEnv.serviceName }, 'Environment validation passed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: CheckStatus.DEGRADED,
        service: env().serviceName,
        timestamp: new Date().toISOString(),
        checks: {
          env: `Environment validation failed: ${errorMessage}`,
          supabase: CheckStatus.SKIPPED,
        },
      };
    }

    // 2) Supabase probe via adapter (no direct client usage)
    let supabaseStatus = CheckStatus.OK;
    try {
      const { data, error } = await this.healthRepo.findMany({
        columns: '*',
        limit: 1,
      });

      if (error) {
        this.logger.error({ error }, 'Supabase health check failed');
        supabaseStatus = CheckStatus.ERROR;
      } else {
        this.logger.debug({ rowCount: data?.length }, 'Supabase health check passed');
        supabaseStatus = CheckStatus.OK;
      }
    } catch (err) {
      this.logger.error({ err }, 'Unexpected error during health check');
      supabaseStatus = CheckStatus.ERROR;
    }

    return {
      status: supabaseStatus === CheckStatus.OK ? CheckStatus.OK : CheckStatus.DEGRADED,
      service: env().serviceName,
      timestamp: new Date().toISOString(),
      checks: {
        env: CheckStatus.OK,
        supabase: supabaseStatus,
      },
    };
  }
}
