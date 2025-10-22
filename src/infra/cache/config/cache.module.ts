import { Global, Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import type { RedisClientOptions } from 'redis';

import { RedisCacheAdapter } from '../adapters/redis-cache.adapter';
import { CACHE_PROVIDER } from '../interfaces/cache-provider.interface';

/**
 * Global cache module
 * Provides cache functionality throughout the application using NestJS cache-manager
 *
 * Uses cache-manager v5 (TTL in milliseconds)
 *
 * Environment variables:
 * - REDIS_URL: Redis connection URL (takes precedence)
 * - REDIS_HOST: Redis host (default: localhost)
 * - REDIS_PORT: Redis port (default: 6379)
 * - REDIS_PASSWORD: Redis password (optional)
 * - REDIS_DB: Redis database number (default: 0)
 * - CACHE_TTL: Default TTL in seconds (default: 300) - converted to ms internally
 * - CACHE_MAX: Max items in cache (default: 100)
 *
 * Usage:
 * 1. HTTP Routes: Use CacheInterceptor with @CacheKey() and @CacheTTL() decorators
 * 2. Services: Inject CACHE_MANAGER directly from @nestjs/cache-manager
 * 3. Custom abstraction: Inject CACHE_PROVIDER for provider-agnostic code
 */
@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        const redisHost = config.get<string>('REDIS_HOST', 'localhost');
        const redisPort = parseInt(config.get<string>('REDIS_PORT', '6379'), 10);
        const redisPassword = config.get<string>('REDIS_PASSWORD');
        const redisDb = parseInt(config.get<string>('REDIS_DB', '0'), 10);
        const cacheTtlSeconds = parseInt(config.get<string>('CACHE_TTL', '300'), 10); // 5 minutes
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
          }),
          max: cacheMax,
          ttl: cacheTtlSeconds * 1000, // cache-manager v5 uses milliseconds
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
