/**
 * Provider-agnostic cache interface following Starment's infrastructure abstraction pattern.
 *
 * This interface abstracts the underlying cache implementation (Redis, Memcached, etc.)
 * similar to how IAuthService abstracts authentication and IUserRepository abstracts data access.
 *
 * TTL values are in seconds (more intuitive than milliseconds).
 */
export interface ICacheProvider {
  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or undefined if not found
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
   * Check if a key exists in cache
   * @param key Cache key
   */
  has(key: string): Promise<boolean>;

  /**
   * Clear all cache entries (use with caution!)
   */
  reset(): Promise<void>;

  /**
   * Get multiple values at once
   * @param keys Cache keys
   * @returns Array of cached values (undefined for missing keys)
   */
  mget<T>(...keys: string[]): Promise<(T | undefined)[]>;

  /**
   * Set multiple values at once
   * @param entries Array of key-value-ttl entries
   */
  mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void>;

  /**
   * Delete multiple keys at once
   * @param keys Cache keys to delete
   */
  delMany(keys: string[]): Promise<void>;

  /**
   * Delete all keys matching a pattern (e.g., 'user:*')
   * Note: This is a convenience method and may not be efficient for large datasets
   * @param pattern Redis-style pattern
   */
  delPattern(pattern: string): Promise<void>;

  /**
   * Increment a numeric value
   * @param key Cache key
   * @param delta Amount to increment by (default: 1)
   * @returns New value after increment
   */
  incr(key: string, delta?: number): Promise<number>;

  /**
   * Decrement a numeric value
   * @param key Cache key
   * @param delta Amount to decrement by (default: 1)
   * @returns New value after decrement
   */
  decr(key: string, delta?: number): Promise<number>;

  /**
   * Get remaining TTL for a key
   * @param key Cache key
   * @returns Remaining TTL in seconds, -1 if no TTL, -2 if key doesn't exist
   */
  ttl(key: string): Promise<number>;

  /**
   * Wrap a function call with caching (cache-aside pattern)
   * @param key Cache key
   * @param fn Function to execute on cache miss
   * @param ttl Time to live in seconds
   * @returns Cached or freshly computed value
   */
  wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T>;
}
