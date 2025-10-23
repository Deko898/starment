import { Inject, Injectable } from '@nestjs/common';
import { CACHE_PROVIDER, ICacheProvider } from '@starment/cache';
import { PinoLogger } from 'nestjs-pino';

import { CheckStatus } from '../interfaces/check-status.enum';

/**
 * Cache (Redis) health indicator.
 *
 * Verifies Redis connectivity by performing a test write and read operation.
 * Uses the CACHE_PROVIDER abstraction to stay consistent with project patterns.
 */
@Injectable()
export class CacheHealthIndicator {
  private readonly healthCheckKey = 'health:check:ping';

  constructor(
    @Inject(CACHE_PROVIDER) private readonly cache: ICacheProvider,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext('CacheHealthIndicator');
  }

  /**
   * Check cache health by performing a write/read/delete cycle
   * @returns CheckStatus indicating cache health
   */
  async check(): Promise<CheckStatus> {
    try {
      const testValue = `ping-${Date.now()}`;

      // 1. Write test value
      await this.cache.set(this.healthCheckKey, testValue, 10); // 10 seconds TTL

      // 2. Read it back
      const retrieved = await this.cache.get<string>(this.healthCheckKey);

      // 3. Clean up
      await this.cache.del(this.healthCheckKey);

      // 4. Verify
      if (retrieved === testValue) {
        this.logger.debug('Cache health check passed');
        return CheckStatus.OK;
      } else {
        this.logger.warn({ expected: testValue, got: retrieved }, 'Cache returned wrong value');
        return CheckStatus.DEGRADED;
      }
    } catch (err) {
      this.logger.error({ err }, 'Cache health check failed');
      return CheckStatus.ERROR;
    }
  }

  /**
   * Get detailed status information
   */
  async getStatus(): Promise<{ status: CheckStatus; message?: string }> {
    const status = await this.check();

    const messages = {
      [CheckStatus.OK]: 'Cache connection healthy',
      [CheckStatus.DEGRADED]: 'Cache connection degraded',
      [CheckStatus.ERROR]: 'Cache connection failed',
      [CheckStatus.SKIPPED]: 'Cache check skipped',
    };

    return {
      status,
      message: messages[status],
    };
  }
}
