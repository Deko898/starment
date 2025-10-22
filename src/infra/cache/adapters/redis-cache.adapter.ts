import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

import type { ICacheProvider } from '../interfaces/cache-provider.interface';

/**
 * Redis cache adapter implementing ICacheProvider
 * Wraps @nestjs/cache-manager with cache-manager-redis-yet under the hood
 */
@Injectable()
export class RedisCacheAdapter implements ICacheProvider, OnModuleDestroy {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async onModuleDestroy(): Promise<void> {
    // Cleanup if needed
  }

  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl ? ttl * 1000 : undefined); // Convert seconds to ms
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async delMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.cacheManager.del(key)));
  }

  async has(key: string): Promise<boolean> {
    const value = await this.cacheManager.get(key);
    return value !== undefined && value !== null;
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  async delPattern(pattern: string): Promise<void> {
    // Note: Pattern deletion requires Redis store access
    // For now, implementing with warning
    // In production, you'd use redis.keys() or SCAN command
    console.warn(
      `delPattern('${pattern}') called but not fully implemented. Use with caution.`,
    );
  }

  async mget<T>(...keys: string[]): Promise<(T | undefined)[]> {
    return await Promise.all(keys.map((key) => this.cacheManager.get<T>(key)));
  }

  async mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    await Promise.all(
      entries.map((entry) =>
        this.cacheManager.set(entry.key, entry.value, entry.ttl ? entry.ttl * 1000 : undefined),
      ),
    );
  }

  async incr(key: string, delta: number = 1): Promise<number> {
    const current = (await this.cacheManager.get<number>(key)) ?? 0;
    const newValue = current + delta;
    await this.cacheManager.set(key, newValue);
    return newValue;
  }

  async decr(key: string, delta: number = 1): Promise<number> {
    return await this.incr(key, -delta);
  }

  async ttl(key: string): Promise<number> {
    // Note: cache-manager doesn't expose TTL directly
    // This is a limitation of the abstraction
    // For production, you'd need direct Redis client access
    const exists = await this.has(key);
    return exists ? -1 : -2; // -1 = no expiry, -2 = doesn't exist
  }
}
