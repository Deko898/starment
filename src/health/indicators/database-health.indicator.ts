import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { HealthRepository } from '../health.repository';
import { CheckStatus } from '../interfaces/check-status.enum';

/**
 * Database health indicator for Supabase.
 *
 * Performs a lightweight query to verify database connectivity.
 * Uses the existing HealthRepository to stay consistent with project patterns.
 */
@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    private readonly healthRepo: HealthRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext('DatabaseHealthIndicator');
  }

  /**
   * Check database health by executing a simple query
   * @returns CheckStatus indicating database health
   */
  async check(): Promise<CheckStatus> {
    try {
      const { data, error } = await this.healthRepo.findMany({
        columns: '*',
        limit: 1,
      });

      if (error) {
        this.logger.error({ error }, 'Database health check failed');
        return CheckStatus.ERROR;
      }

      this.logger.debug({ rowCount: data?.length }, 'Database health check passed');
      return CheckStatus.OK;
    } catch (err) {
      this.logger.error({ err }, 'Unexpected error during database health check');
      return CheckStatus.ERROR;
    }
  }

  /**
   * Get detailed status information
   */
  async getStatus(): Promise<{ status: CheckStatus; message?: string }> {
    const status = await this.check();

    return {
      status,
      message:
        status === CheckStatus.OK
          ? 'Database connection healthy'
          : 'Database connection failed',
    };
  }
}
