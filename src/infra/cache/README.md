# Cache Module

Provider-agnostic caching layer for Starment API.

## Architecture

This cache implementation follows the project's infrastructure abstraction pattern:

```
src/infra/cache/
├── interfaces/          # Provider-agnostic interfaces
│   └── cache-provider.interface.ts  (ICacheProvider, CACHE_PROVIDER)
├── adapters/            # Concrete implementations
│   └── redis-cache.adapter.ts       (RedisCacheAdapter)
├── config/              # Module configuration
│   └── cache.module.ts              (CacheModule)
└── decorators/          # Utility decorators
    └── cached.decorator.ts          (@Cached, @CacheInvalidate)
```

## Installation

### 1. Install Dependencies

```bash
npm install @nestjs/cache-manager cache-manager cache-manager-redis-yet redis
```

### 2. Environment Configuration

Add to `.env`:

```bash
# Redis Configuration (all optional with sensible defaults)
REDIS_HOST=localhost        # Default: localhost
REDIS_PORT=6379            # Default: 6379
REDIS_PASSWORD=            # Optional
REDIS_DB=0                 # Default: 0
REDIS_URL=                 # Alternative to host/port (takes precedence)

# Cache Configuration
CACHE_TTL=300             # Default TTL in seconds (5 minutes)
CACHE_MAX=100             # Max items in cache
```

### 3. Module is Already Imported

`CacheModule` is already imported in `AppModule` and provides `CACHE_PROVIDER` globally.

## Usage

### Option 1: Dependency Injection (Recommended)

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_PROVIDER, ICacheProvider } from '@starment/cache';

@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_PROVIDER) private readonly cache: ICacheProvider,
  ) {}

  async getUser(userId: string): Promise<User> {
    const cacheKey = `user:${userId}`;

    // Try cache first
    const cached = await this.cache.get<User>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from DB
    const user = await this.userRepo.findById(userId);

    // Store in cache (300 seconds TTL)
    await this.cache.set(cacheKey, user, 300);

    return user;
  }
}
```

### Option 2: Decorator-based Caching

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_PROVIDER, ICacheProvider, Cached, CacheInvalidate } from '@starment/cache';

@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_PROVIDER) private readonly cache: ICacheProvider,
  ) {}

  // Automatically cache with @Cached decorator
  @Cached((userId) => `user:${userId}`, 300)
  async getUser(userId: string): Promise<User> {
    return this.userRepo.findById(userId);
  }

  // Automatically invalidate cache after update
  @CacheInvalidate((userId) => `user:${userId}`)
  async updateUser(userId: string, data: UpdateUserDto): Promise<User> {
    return this.userRepo.update(userId, data);
  }

  // Invalidate multiple keys
  @CacheInvalidate((userId) => [`user:${userId}`, `users:list`])
  async deleteUser(userId: string): Promise<void> {
    await this.userRepo.delete(userId);
  }
}
```

## API Reference

### ICacheProvider Interface

```typescript
interface ICacheProvider {
  // Basic operations
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  reset(): Promise<void>;

  // Bulk operations
  mget<T>(...keys: string[]): Promise<(T | undefined)[]>;
  mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void>;
  delMany(keys: string[]): Promise<void>;
  delPattern(pattern: string): Promise<void>;

  // Numeric operations
  incr(key: string, delta?: number): Promise<number>;
  decr(key: string, delta?: number): Promise<number>;

  // Utility
  ttl(key: string): Promise<number>;
}
```

### Cache Decorators

**@Cached(keyGenerator, ttl?)**
- Automatically caches method return value
- Requires `cache` property injected as `CACHE_PROVIDER`

**@CacheInvalidate(keyGenerator)**
- Automatically invalidates cache keys after method execution
- Supports single key or array of keys

## Examples

### Caching User Profiles

```typescript
async getCreatorProfile(userId: string): Promise<ProfileResponse> {
  const cacheKey = `profile:creator:${userId}`;

  const cached = await this.cache.get<ProfileResponse>(cacheKey);
  if (cached) return cached;

  const profile = await this.profileRepo.getCreatorProfile(userId);
  await this.cache.set(cacheKey, profile, 300);

  return profile;
}
```

### Caching Lists with Pagination

```typescript
async getUsers(page: number, limit: number): Promise<User[]> {
  const cacheKey = `users:list:${page}:${limit}`;

  const cached = await this.cache.get<User[]>(cacheKey);
  if (cached) return cached;

  const users = await this.userRepo.find({ skip: page * limit, take: limit });
  await this.cache.set(cacheKey, users, 60); // 1 minute for lists

  return users;
}
```

### Rate Limiting

```typescript
async checkRateLimit(userId: string): Promise<boolean> {
  const key = `ratelimit:${userId}`;
  const count = await this.cache.incr(key);

  if (count === 1) {
    // First request - set expiry
    await this.cache.set(key, count, 60); // 1 minute window
  }

  return count <= 100; // 100 requests per minute
}
```

### Distributed Locks

```typescript
async acquireLock(resource: string, ttl: number = 30): Promise<boolean> {
  const lockKey = `lock:${resource}`;
  const hasLock = await this.cache.has(lockKey);

  if (hasLock) {
    return false; // Lock already acquired
  }

  await this.cache.set(lockKey, true, ttl);
  return true;
}

async releaseLock(resource: string): Promise<void> {
  await this.cache.del(`lock:${resource}`);
}
```

## Migration to Different Cache Provider

To switch from Redis to another provider (e.g., Memcached, In-Memory):

1. Create new adapter implementing `ICacheProvider`
2. Update `CacheModule` to use new adapter
3. No changes needed in business logic!

## Performance

- **Cache Hit**: ~1-5ms (local Redis)
- **Cache Miss + DB Query**: ~10-50ms (depends on DB query)
- **Recommendation**: Cache frequently accessed, slowly changing data

## Cache Key Naming Convention

```
<domain>:<entity>:<identifier>
<domain>:<operation>:<params>

Examples:
- user:123
- profile:creator:456
- users:list:page:1:limit:20
- auth:session:token:xyz
- metrics:daily:2025-01-15
```

## Best Practices

1. **Always set TTL** - Prevent stale data
2. **Use namespaced keys** - Avoid collisions
3. **Cache immutable data longer** - Static data can have higher TTL
4. **Invalidate on writes** - Clear cache when data changes
5. **Monitor cache hit rate** - Optimize what you cache
6. **Handle cache failures gracefully** - App should work without cache

## Troubleshooting

**Cache not working:**
- Check Redis connection: `docker ps` or `redis-cli ping`
- Verify environment variables
- Check logs for connection errors

**Stale data:**
- Reduce TTL
- Implement cache invalidation on updates
- Use `delPattern()` for bulk invalidation

**Memory issues:**
- Reduce `CACHE_MAX`
- Lower TTL values
- Configure Redis maxmemory policy
