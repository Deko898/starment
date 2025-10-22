import { Global, Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import { CacheableMemory } from 'cacheable';

import { RedisCacheAdapter } from '../adapters/redis-cache.adapter';
import { CACHE_PROVIDER } from '../interfaces/cache-provider.interface';

/**
 * Global cache module using modern Keyv-based caching
 *
 * Features:
 * - Multi-store support (memory + Redis)
 * - Memory store serves as fast L1 cache
 * - Redis serves as persistent L2 cache
 * - TTL in milliseconds (Keyv standard)
 *
 * Environment variables:
 * - REDIS_URL: Redis connection URL (e.g., redis://localhost:6379)
 * - REDIS_HOST: Redis host (default: localhost) - used if REDIS_URL not set
 * - REDIS_PORT: Redis port (default: 6379) - used if REDIS_URL not set
 * - REDIS_PASSWORD: Redis password (optional)
 * - REDIS_DB: Redis database number (default: 0)
 * - CACHE_TTL: Default TTL in milliseconds (default: 300000 = 5 minutes)
 * - CACHE_MAX: Max items in memory cache (default: 5000)
 *
 * Usage:
 * 1. HTTP Routes: @UseInterceptors(CacheInterceptor) with @CacheKey() and @CacheTTL()
 * 2. Services: @Inject(CACHE_MANAGER) private cacheManager: Cache
 * 3. Custom abstraction: @Inject(CACHE_PROVIDER) private cache: ICacheProvider
 */
@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        const redisHost = config.get<string>('REDIS_HOST', 'localhost');
        const redisPort = config.get<string>('REDIS_PORT', '6379');
        const redisPassword = config.get<string>('REDIS_PASSWORD');
        const redisDb = parseInt(config.get<string>('REDIS_DB', '0'), 10);
        const cacheTtl = parseInt(config.get<string>('CACHE_TTL', '300000'), 10); // 5 minutes in ms
        const cacheMax = parseInt(config.get<string>('CACHE_MAX', '5000'), 10);

        // Build Redis connection string
        const connectionString =
          redisUrl ||
          `redis://${redisPassword ? `:${redisPassword}@` : ''}${redisHost}:${redisPort}/${redisDb}`;

        return {
          stores: [
            // L1 cache: In-memory (fast, limited size)
            new Keyv({
              store: new CacheableMemory({ ttl: cacheTtl, lruSize: cacheMax }),
            }),
            // L2 cache: Redis (persistent, unlimited size)
            new KeyvRedis(connectionString),
          ],
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
