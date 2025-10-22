import { Global, Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import type { RedisClientOptions } from 'redis';

import { RedisCacheAdapter } from '../adapters/redis-cache.adapter';
import { CACHE_PROVIDER } from '../interfaces/cache-provider.interface';

/**
 * Global cache module
 * Provides cache functionality throughout the application
 *
 * Environment variables:
 * - REDIS_URL: Redis connection URL (takes precedence)
 * - REDIS_HOST: Redis host (default: localhost)
 * - REDIS_PORT: Redis port (default: 6379)
 * - REDIS_PASSWORD: Redis password (optional)
 * - REDIS_DB: Redis database number (default: 0)
 * - CACHE_TTL: Default TTL in seconds (default: 300)
 * - CACHE_MAX: Max items in cache (default: 100)
 */
@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync<RedisClientOptions>({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        const redisHost = config.get<string>('REDIS_HOST', 'localhost');
        const redisPort = parseInt(config.get<string>('REDIS_PORT', '6379'), 10);
        const redisPassword = config.get<string>('REDIS_PASSWORD');
        const redisDb = parseInt(config.get<string>('REDIS_DB', '0'), 10);
        const cacheTtl = parseInt(config.get<string>('CACHE_TTL', '300'), 10); // 5 minutes
        const cacheMax = parseInt(config.get<string>('CACHE_MAX', '100'), 10);

        return {
          store: await redisStore({
            socket: redisUrl
              ? undefined
              : {
                  host: redisHost,
                  port: redisPort,
                },
            url: redisUrl,
            password: redisPassword,
            database: redisDb,
            ttl: cacheTtl * 1000, // Convert seconds to ms
          }),
          max: cacheMax,
          ttl: cacheTtl * 1000, // Convert seconds to ms
        };
      },
    }),
  ],
  providers: [
    RedisCacheAdapter,
    {
      provide: CACHE_PROVIDER,
      useExisting: RedisCacheAdapter,
    },
  ],
  exports: [CACHE_PROVIDER, RedisCacheAdapter],
})
export class CacheModule {}
