import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ICacheProvider } from '../interfaces/cache-provider.interface';

/**
 * Redis cache adapter wrapping NestJS CACHE_MANAGER.
 *
 * Provides a provider-agnostic interface following Starment's infrastructure pattern.
 * Internally uses CACHE_MANAGER with multi-store (Memory L1 + Redis L2).
 *
 * Key differences from direct CACHE_MANAGER usage:
 * - TTL in seconds (not milliseconds) for better DX
 * - Enhanced API with bulk operations, pattern deletion, and numeric ops
 * - Consistent with other Starment adapters (auth, database)
 */
@Injectable()
export class RedisCacheAdapter implements ICacheProvider {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Convert TTL from seconds to milliseconds (CACHE_MANAGER uses ms)
    const ttlMs = ttl ? ttl * 1000 : undefined;
    await this.cacheManager.set(key, value, ttlMs);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async has(key: string): Promise<boolean> {
    const value = await this.cacheManager.get(key);
    return value !== undefined;
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  async mget<T>(...keys: string[]): Promise<(T | undefined)[]> {
    // cache-manager doesn't have native mget, so we do parallel gets
    return Promise.all(keys.map((key) => this.get<T>(key)));
  }

  async mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    // Execute all sets in parallel
    await Promise.all(entries.map((entry) => this.set(entry.key, entry.value, entry.ttl)));
  }

  async delMany(keys: string[]): Promise<void> {
    // Execute all deletions in parallel
    await Promise.all(keys.map((key) => this.del(key)));
  }

  async delPattern(pattern: string): Promise<void> {
    /**
     * Note: Pattern deletion is not natively supported by cache-manager.
     * This is a limitation when using the abstraction.
     *
     * Workarounds:
     * 1. Track keys manually (e.g., Set<string> in memory)
     * 2. Use Redis client directly for this operation
     * 3. Use key namespacing and reset specific namespaces
     *
     * For now, we throw to prevent silent failures.
     */
    throw new Error(
      `delPattern('${pattern}') is not supported by cache-manager abstraction. ` +
        `Consider using key namespacing with delMany() or tracking keys manually.`,
    );
  }

  async incr(key: string, delta: number = 1): Promise<number> {
    /**
     * Note: Atomic increment is not natively supported by cache-manager.
     * This implementation is NOT atomic and may have race conditions.
     *
     * For production use with rate limiting, consider using Redis client directly.
     */
    const current = (await this.get<number>(key)) ?? 0;
    const newValue = current + delta;
    await this.set(key, newValue);
    return newValue;
  }

  async decr(key: string, delta: number = 1): Promise<number> {
    return this.incr(key, -delta);
  }

  async ttl(key: string): Promise<number> {
    /**
     * Note: TTL retrieval is not supported by cache-manager abstraction.
     * Returns -1 (no TTL) as we cannot determine the actual TTL.
     */
    const exists = await this.has(key);
    return exists ? -1 : -2;
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    // Convert TTL from seconds to milliseconds
    const ttlMs = ttl ? ttl * 1000 : undefined;
    return this.cacheManager.wrap(key, fn, ttlMs);
  }
}
