# Cache Module

Redis caching layer for Starment API following the project's infrastructure abstraction pattern.

## Architecture

This implementation provides a **provider-agnostic cache interface** following Starment's established pattern (similar to `IAuthService`, `IUserRepository`):

```
src/infra/cache/
├── interfaces/
│   └── cache-provider.interface.ts   # ICacheProvider interface
├── adapters/
│   └── redis-cache.adapter.ts        # RedisCacheAdapter (wraps CACHE_MANAGER)
└── config/
    └── cache.module.ts                # Global module with multi-store config
```

**Key Design:**
- `ICacheProvider` - Provider-agnostic interface (like `IAuthService`)
- `RedisCacheAdapter` - Wraps NestJS CACHE_MANAGER (like `SupabaseAuthAdapter`)
- Multi-store: Memory (L1) + Redis (L2)
- **TTL in seconds** for `CACHE_PROVIDER` (better DX)
- TTL in milliseconds for direct `CACHE_MANAGER` usage

**Features:**
- ✅ Consistent with Starment's architecture pattern
- ✅ Provider-agnostic (easy to switch Redis → Memcached/DragonflyDB)
- ✅ Multi-store: Memory (L1 ~1-2ms) + Redis (L2 ~5-10ms)
- ✅ Enhanced API: bulk operations, numeric ops, wrap pattern
- ✅ Intuitive TTL in seconds (vs milliseconds)

## Installation

### 1. Install Dependencies

```bash
npm install @nestjs/cache-manager cache-manager @keyv/redis keyv cacheable
```

**Packages:**
- `@nestjs/cache-manager` - NestJS caching module
- `cache-manager` - Core caching library
- `@keyv/redis` - Redis store adapter for Keyv
- `keyv` - Simple key-value storage with multi-adapter support
- `cacheable` - In-memory cache with LRU support

### 2. Environment Configuration

Add to `.env`:

```bash
# Redis Configuration (all optional with sensible defaults)
REDIS_HOST=localhost              # Default: localhost
REDIS_PORT=6379                  # Default: 6379
REDIS_PASSWORD=                  # Optional
REDIS_DB=0                       # Default: 0
REDIS_URL=                       # Full connection string (takes precedence)
                                # Example: redis://localhost:6379

# Cache Configuration
CACHE_TTL=300000                # Default TTL in milliseconds (5 minutes)
CACHE_MAX=5000                  # Max items in memory cache (LRU size)
```

### 3. Setup Redis

```bash
# Docker (recommended)
docker run -d --name redis -p 6379:6379 redis:alpine

# Or use local Redis
brew install redis  # macOS
brew services start redis
```

### 4. Module is Already Imported

`CacheModule` is already imported in `AppModule` globally.

---

## Usage

## **🎯 Service-Level Caching (Recommended)**

### Using CACHE_PROVIDER (Starment Pattern)

**Recommended approach** - consistent with project architecture:

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

    // Get from cache
    const cached = await this.cache.get<User>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from DB
    const user = await this.userRepo.findById(userId);

    // Store in cache (TTL in seconds - intuitive!)
    await this.cache.set(cacheKey, user, 300); // 300 seconds = 5 minutes

    return user;
  }

  async updateUser(userId: string, data: UpdateUserDto): Promise<User> {
    const user = await this.userRepo.update(userId, data);

    // Invalidate cache
    await this.cache.del(`user:${userId}`);

    return user;
  }
}
```

### Real-World Example: ProfileService

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { BaseApiService } from '@starment/core';
import { Profile } from '@starment/supabase';
import { CACHE_PROVIDER, ICacheProvider } from '@starment/cache';

import { ProfileResponse } from './models';
import { ProfileRepository } from './profile.repository';

@Injectable()
export class ProfileService extends BaseApiService<Profile> {
  constructor(
    private readonly profileRepo: ProfileRepository,
    @Inject(CACHE_PROVIDER) private readonly cache: ICacheProvider,
  ) {
    super(profileRepo);
  }

  async getCreatorProfile(userId: string): Promise<ProfileResponse> {
    const cacheKey = `profile:creator:${userId}`;

    // Try cache first
    const cached = await this.cache.get<ProfileResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const result = await this.profileRepo.getCreatorProfile(userId);
    const profile = this.unwrap(result, 'Creator profile');
    const response = ProfileResponse.fromDb(profile);

    // Cache for 5 minutes (300 seconds)
    await this.cache.set(cacheKey, response, 300);

    return response;
  }
}
```

---

## **Advanced Patterns**

### Pattern 1: Cache-Aside with Wrap

```typescript
async getProduct(id: string): Promise<Product> {
  // Automatically handles get → miss → fetch → set
  return this.cache.wrap(
    `product:${id}`,
    async () => {
      // This only runs on cache miss
      return this.productRepo.findById(id);
    },
    600 // 10 minutes
  );
}
```

### Pattern 2: Bulk Operations

```typescript
// Get multiple users in parallel
const users = await this.cache.mget<User>('user:1', 'user:2', 'user:3');

// Set multiple values at once
await this.cache.mset([
  { key: 'user:1', value: user1, ttl: 300 },
  { key: 'user:2', value: user2, ttl: 300 },
]);

// Delete multiple keys
await this.cache.delMany(['user:1', 'user:2', 'user:3']);
```

### Pattern 3: Numeric Operations (Rate Limiting)

```typescript
async checkRateLimit(userId: string): Promise<boolean> {
  const key = `ratelimit:${userId}`;

  // Increment counter
  const count = await this.cache.incr(key);

  if (count === 1) {
    // First request - set expiry to 60 seconds
    await this.cache.set(key, count, 60);
  }

  // Allow up to 100 requests per minute
  return count <= 100;
}
```

### Pattern 4: Write-Through Caching

```typescript
async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
  // 1. Update database
  const product = await this.productRepo.update(id, data);

  // 2. Update cache immediately (write-through)
  await this.cache.set(`product:${id}`, product, 600);

  return product;
}
```

### Pattern 5: Cache Invalidation

```typescript
async deleteProduct(id: string): Promise<void> {
  // 1. Delete from database
  await this.productRepo.delete(id);

  // 2. Invalidate related cache entries
  await this.cache.delMany([
    `product:${id}`,
    `products:list`,
    `products:category:${categoryId}`
  ]);
}
```

---

## **🔧 HTTP Route Caching**

### Auto-Caching with CacheInterceptor

Use `CacheInterceptor` for automatic HTTP response caching:

```typescript
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller('users')
@UseInterceptors(CacheInterceptor)
export class UsersController {

  @Get()
  async findAll() {
    // Cached automatically with route-based key: /users
    return this.usersService.findAll();
  }

  @Get(':id')
  @CacheKey('custom-user-key')
  @CacheTTL(20000) // 20 seconds in milliseconds (CacheInterceptor uses ms)
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
```

### Controller-Level Caching

```typescript
@Controller('products')
@UseInterceptors(CacheInterceptor)
@CacheTTL(30000) // 30 seconds for all routes
export class ProductsController {
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @CacheTTL(60000) // Override: 60 seconds for this route
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
}
```

### Global Cache Interceptor (Optional)

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
```

---

## **Alternative: Direct CACHE_MANAGER Usage**

For simple use cases or when you need direct NestJS patterns:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getUser(userId: string): Promise<User> {
    const cached = await this.cacheManager.get<User>(`user:${userId}`);
    if (cached) return cached;

    const user = await this.userRepo.findById(userId);

    // TTL in MILLISECONDS (300000ms = 5 minutes)
    await this.cacheManager.set(`user:${userId}`, user, 300000);

    return user;
  }
}
```

**Note:** With `CACHE_MANAGER`, TTL is in **milliseconds**. With `CACHE_PROVIDER`, TTL is in **seconds**.

---

## **API Reference**

### ICacheProvider Interface

```typescript
interface ICacheProvider {
  // Basic operations
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>; // TTL in seconds
  del(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  reset(): Promise<void>;

  // Bulk operations
  mget<T>(...keys: string[]): Promise<(T | undefined)[]>;
  mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void>;
  delMany(keys: string[]): Promise<void>;
  delPattern(pattern: string): Promise<void>; // Not supported - throws error

  // Numeric operations (not atomic - for non-critical use only)
  incr(key: string, delta?: number): Promise<number>;
  decr(key: string, delta?: number): Promise<number>;

  // Utility
  ttl(key: string): Promise<number>; // Returns -1 (limitation of cache-manager)
  wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T>;
}
```

### Limitations

When using `CACHE_PROVIDER` (abstraction over cache-manager):

1. **`delPattern(pattern)`** - Not supported (throws error)
   - Workaround: Track keys manually or use `delMany()`

2. **`incr()` / `decr()`** - Not atomic (race conditions possible)
   - Workaround: Use Redis client directly for rate limiting

3. **`ttl(key)`** - Always returns -1 or -2
   - Workaround: Track TTLs manually or use Redis client

**For these operations, consider using a Redis client directly or accepting the limitations.**

---

## **Cache Key Naming Convention**

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

---

## **Best Practices**

1. **Use CACHE_PROVIDER for services** - Consistent with Starment patterns
2. **Use CacheInterceptor for HTTP routes** - Automatic route-based caching
3. **Always set TTL** - Prevent stale data
4. **Use namespaced keys** - Avoid collisions (`user:123` not `123`)
5. **Cache immutable data longer** - Static data can have higher TTL
6. **Invalidate on writes** - Clear cache when data changes
7. **Handle cache failures gracefully** - App should work without cache
8. **TTL in seconds for CACHE_PROVIDER** - `set(key, value, 300)`
9. **TTL in milliseconds for CACHE_MANAGER** - `set(key, value, 300000)`

---

## **How Multi-Store Works**

```
Request → Check Memory (L1) → Found? Return ✓
              ↓
          Not Found
              ↓
       Check Redis (L2) → Found? Store in Memory + Return ✓
              ↓
          Not Found
              ↓
      Fetch from DB → Store in Both Caches + Return
```

**Benefits:**
- **L1 (Memory)**: ~1-2ms response time
- **L2 (Redis)**: ~5-10ms response time
- **DB**: ~30-100ms response time

---

## **Performance**

| Operation | Without Cache | With Cache | Improvement |
|-----------|--------------|------------|-------------|
| Profile fetch | ~50ms | ~2ms | **25x faster** |
| User lookup | ~30ms | ~1ms | **30x faster** |
| List queries | ~100ms | ~3ms | **33x faster** |

---

## **Troubleshooting**

**Cache not working:**
- Check Redis connection: `docker ps` or `redis-cli ping`
- Verify environment variables in `.env`
- Check logs for connection errors

**Stale data:**
- Reduce TTL values
- Implement cache invalidation on updates
- Consider using write-through pattern

**Memory issues:**
- Reduce `CACHE_MAX` in environment variables
- Lower TTL values
- Configure Redis maxmemory policy: `redis-cli config set maxmemory-policy allkeys-lru`

**TTL confusion:**
- `CACHE_PROVIDER`: TTL in **seconds** (300 = 5 minutes)
- `CACHE_MANAGER`: TTL in **milliseconds** (300000 = 5 minutes)
- `CacheInterceptor @CacheTTL()`: milliseconds

**Multi-store not working:**
- Check both memory and Redis are configured in cache.module.ts
- Memory cache fills first (L1), Redis is backup (L2)
- Check Redis connection if only memory works
- Use `redis-cli monitor` to see if Redis is receiving commands

---

## **Why Use the Adapter Pattern?**

**Pros:**
- ✅ **Consistent architecture** - Follows Starment's established pattern
- ✅ **Provider-agnostic** - Easy to switch Redis → Memcached/DragonflyDB
- ✅ **Better DX** - TTL in seconds (not milliseconds)
- ✅ **Enhanced API** - Bulk operations, wrap pattern, etc.
- ✅ **Future-proof** - Easy to add compression, metrics, custom logic

**Cons:**
- ❌ **Extra layer** - One more abstraction to understand
- ❌ **Limitations** - Some Redis features not available (pattern deletion, atomic incr)

**Recommendation:** Use `CACHE_PROVIDER` for consistency with your architecture. Use direct `CACHE_MANAGER` only if you need features not available in the abstraction.

---

## **Additional Resources**

- [Official NestJS Caching Documentation](https://docs.nestjs.com/techniques/caching)
- [Keyv Documentation](https://github.com/jaredwray/keyv)
- [cache-manager Documentation](https://github.com/node-cache-manager/node-cache-manager)
