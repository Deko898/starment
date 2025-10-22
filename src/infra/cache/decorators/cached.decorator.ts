/**
 * Cache decorator for automatic method caching
 *
 * @param keyGenerator Function to generate cache key from method arguments
 * @param ttl Time to live in seconds (optional, uses default if not provided)
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(@Inject(CACHE_PROVIDER) private cache: ICacheProvider) {}
 *
 *   @Cached((userId) => `user:${userId}`, 300)
 *   async getUser(userId: string): Promise<User> {
 *     return this.userRepo.findById(userId);
 *   }
 * }
 * ```
 */
export function Cached(
  keyGenerator: (...args: any[]) => string,
  ttl?: number,
): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache = (this as any).cache;

      if (!cache) {
        console.warn(
          `@Cached decorator used but no 'cache' property found on ${target.constructor.name}. ` +
            `Make sure to inject CACHE_PROVIDER as 'cache' in the constructor.`,
        );
        return originalMethod.apply(this, args);
      }

      const cacheKey = keyGenerator(...args);

      // Try cache first
      const cached = await cache.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }

      // Cache miss - execute original method
      const result = await originalMethod.apply(this, args);

      // Store in cache
      await cache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Cache invalidation decorator
 * Automatically invalidates cache after method execution
 *
 * @param keyGenerator Function to generate cache key(s) to invalidate
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   @CacheInvalidate((userId) => `user:${userId}`)
 *   async updateUser(userId: string, data: UpdateUserDto): Promise<User> {
 *     return this.userRepo.update(userId, data);
 *   }
 *
 *   @CacheInvalidate((userId) => [`user:${userId}`, `users:list`])
 *   async deleteUser(userId: string): Promise<void> {
 *     await this.userRepo.delete(userId);
 *   }
 * }
 * ```
 */
export function CacheInvalidate(
  keyGenerator: (...args: any[]) => string | string[],
): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache = (this as any).cache;

      // Execute original method first
      const result = await originalMethod.apply(this, args);

      // Invalidate cache after successful execution
      if (cache) {
        const keys = keyGenerator(...args);
        const keysArray = Array.isArray(keys) ? keys : [keys];
        await cache.delMany(keysArray);
      } else {
        console.warn(
          `@CacheInvalidate decorator used but no 'cache' property found on ${target.constructor.name}`,
        );
      }

      return result;
    };

    return descriptor;
  };
}
