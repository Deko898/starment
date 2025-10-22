/**
 * Cache provider DI token
 */
export const CACHE_PROVIDER = Symbol('CACHE_PROVIDER');

/**
 * Cache provider interface - cache implementation agnostic
 * Can be implemented by Redis, Memcached, in-memory, etc.
 */
export interface ICacheProvider {
  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or undefined if not found/expired
   */
  get<T>(key: string): Promise<T | undefined>;

  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional, uses default if not provided)
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Delete a value from cache
   * @param key Cache key
   */
  del(key: string): Promise<void>;

  /**
   * Delete multiple values from cache
   * @param keys Array of cache keys
   */
  delMany(keys: string[]): Promise<void>;

  /**
   * Check if a key exists in cache
   * @param key Cache key
   * @returns True if key exists, false otherwise
   */
  has(key: string): Promise<boolean>;

  /**
   * Clear all cached values (use with caution!)
   */
  reset(): Promise<void>;

  /**
   * Delete all keys matching a pattern
   * @param pattern Key pattern (e.g., "user:*")
   */
  delPattern(pattern: string): Promise<void>;

  /**
   * Get multiple values from cache
   * @param keys Array of cache keys
   * @returns Array of values (undefined for missing keys)
   */
  mget<T>(...keys: string[]): Promise<(T | undefined)[]>;

  /**
   * Set multiple values in cache
   * @param entries Array of key-value-ttl tuples
   */
  mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void>;

  /**
   * Increment a numeric value in cache
   * @param key Cache key
   * @param delta Amount to increment (default 1)
   * @returns New value after increment
   */
  incr(key: string, delta?: number): Promise<number>;

  /**
   * Decrement a numeric value in cache
   * @param key Cache key
   * @param delta Amount to decrement (default 1)
   * @returns New value after decrement
   */
  decr(key: string, delta?: number): Promise<number>;

  /**
   * Get remaining TTL for a key
   * @param key Cache key
   * @returns Remaining TTL in seconds, -1 if key has no expiry, -2 if key doesn't exist
   */
  ttl(key: string): Promise<number>;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /**
   * Default TTL in seconds
   */
  ttl: number;

  /**
   * Maximum number of items in cache (for in-memory implementations)
   */
  max?: number;

  /**
   * Redis connection string (for Redis implementations)
   */
  url?: string;

  /**
   * Redis host (alternative to url)
   */
  host?: string;

  /**
   * Redis port (alternative to url)
   */
  port?: number;

  /**
   * Redis password
   */
  password?: string;

  /**
   * Redis database number
   */
  db?: number;

  /**
   * Enable compression for cached values
   */
  compress?: boolean;

  /**
   * Key prefix for all cache keys
   */
  keyPrefix?: string;
}
