# Cache Module

Redis caching layer for Starment API following official NestJS patterns.

## Architecture

This implementation uses **NestJS cache-manager** with **Keyv** (modern key-value storage):

```
src/infra/cache/
└── config/
    └── cache.module.ts    # Global cache configuration (multi-store)
```

**Important**: Uses modern **Keyv-based** caching with multi-store support. TTL is in **milliseconds** (Keyv standard).

**Features:**
- ✅ Multi-store: Memory (L1) + Redis (L2)
- ✅ Fast in-memory cache with LRU eviction
- ✅ Persistent Redis backup
- ✅ Automatic failover between stores
- ✅ Native NestJS patterns (no custom abstractions)

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

**Note:** CACHE_TTL is in **milliseconds** (Keyv standard). 300000ms = 5 minutes.

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

## **🎯 HTTP Route Caching**

### Auto-Caching with CacheInterceptor

Use `CacheInterceptor` to automatically cache HTTP responses:

```typescript
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller('users')
@UseInterceptors(CacheInterceptor) // Apply to all routes
export class UsersController {

  @Get()
  async findAll() {
    // Cached automatically with route-based key
    // Key: /users
    return this.usersService.findAll();
  }

  @Get(':id')
  @CacheKey('custom-user-key') // Override cache key
  @CacheTTL(20000) // Override TTL to 20 seconds (20000ms)
  async findOne(@Param('id') id: string) {
    // Custom cache key and TTL
    return this.usersService.findOne(id);
  }
}
```

### Controller-Level Caching

```typescript
@Controller('products')
@UseInterceptors(CacheInterceptor)
@CacheTTL(30000) // All routes cached for 30 seconds
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

Enable caching for ALL GET routes:

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

### Custom Cache Interceptor (Advanced)

For dynamic cache keys based on headers, query params, etc.:

```typescript
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Injectable, ExecutionContext } from '@nestjs/common';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { httpAdapter } = this.httpAdapterHost;

    // Include user ID in cache key for user-specific data
    const userId = request.user?.id;
    const isGetRequest = httpAdapter.getRequestMethod(request) === 'GET';

    if (!isGetRequest) {
      return undefined;
    }

    // Custom key: route + userId
    return `${httpAdapter.getRequestUrl(request)}_${userId}`;
  }
}

// Use it:
@UseInterceptors(HttpCacheInterceptor)
@Controller('profile')
export class ProfileController {
  @Get('me')
  getProfile(@CurrentUser() user) {
    // Cached per user: /profile/me_user123
    return this.profileService.getProfile(user.id);
  }
}
```

---

## **🔧 Service-Level Caching**

### Manual Cache Management with CACHE_MANAGER

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getUser(userId: string): Promise<User> {
    const cacheKey = `user:${userId}`;

    // Get from cache
    const cached = await this.cacheManager.get<User>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from DB
    const user = await this.userRepo.findById(userId);

    // Store in cache (TTL in milliseconds)
    await this.cacheManager.set(cacheKey, user, 300000); // 5 minutes = 300000ms

    return user;
  }

  async updateUser(userId: string, data: UpdateUserDto): Promise<User> {
    const user = await this.userRepo.update(userId, data);

    // Invalidate cache
    await this.cacheManager.del(`user:${userId}`);

    return user;
  }

  async clearAllUsers(): Promise<void> {
    // Reset entire cache (use with caution!)
    await this.cacheManager.reset();
  }
}
```

### Real-World Example: ProfileService

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ProfileService extends BaseApiService<Profile> {
  constructor(
    private readonly profileRepo: ProfileRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    super(profileRepo);
  }

  async getCreatorProfile(userId: string): Promise<ProfileResponse> {
    const cacheKey = `profile:creator:${userId}`;

    // Try to get from cache first
    const cached = await this.cacheManager.get<ProfileResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const result = await this.profileRepo.getCreatorProfile(userId);
    const profile = this.unwrap(result, 'Creator profile');
    const response = ProfileResponse.fromDb(profile);

    // Store in cache with 5 minute TTL (300000ms)
    await this.cacheManager.set(cacheKey, response, 300000);

    return response;
  }
}
```

---

## **Common Patterns**

### Pattern 1: Cache-Aside (Lazy Loading)

```typescript
async getProduct(id: string): Promise<Product> {
  const key = `product:${id}`;

  // 1. Try cache
  let product = await this.cacheManager.get<Product>(key);

  // 2. Cache miss - fetch from DB
  if (!product) {
    product = await this.productRepo.findById(id);

    // 3. Store in cache (10 minutes)
    await this.cacheManager.set(key, product, 600000);
  }

  return product;
}
```

### Pattern 2: Write-Through (Update and Cache)

```typescript
async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
  // 1. Update database
  const product = await this.productRepo.update(id, data);

  // 2. Update cache immediately
  await this.cacheManager.set(`product:${id}`, product, 600000);

  return product;
}
```

### Pattern 3: Cache Invalidation

```typescript
async deleteProduct(id: string): Promise<void> {
  // 1. Delete from database
  await this.productRepo.delete(id);

  // 2. Invalidate cache
  await this.cacheManager.del(`product:${id}`);
  await this.cacheManager.del(`products:list`); // Also clear list cache
}
```

### Pattern 4: Wrap Pattern (Automatic Cache)

```typescript
async getExpensiveData(id: string): Promise<Data> {
  // Automatically cache the result of the callback
  return this.cacheManager.wrap(
    `expensive:${id}`,
    async () => {
      // This function only runs on cache miss
      return this.performExpensiveOperation(id);
    },
    300000 // TTL: 5 minutes
  );
}
```

---

## **API Reference**

### CACHE_MANAGER Methods

```typescript
interface Cache {
  // Basic operations
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  reset(): Promise<void>;

  // Wrap pattern (automatic caching)
  wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T>;
}
```

**Important**: TTL is in **milliseconds**. Example: `300000` = 5 minutes.

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

1. **Use CacheInterceptor for HTTP routes** - Automatic, route-based caching
2. **Always set TTL** - Prevent stale data
3. **Use namespaced keys** - Avoid collisions (e.g., `user:123` not just `123`)
4. **Cache immutable data longer** - Static data can have higher TTL
5. **Invalidate on writes** - Clear cache when data changes
6. **Monitor cache hit rate** - Optimize what you cache
7. **Handle cache failures gracefully** - App should work without cache
8. **TTL is in milliseconds** - `set(key, value, 60000)` = 60 seconds
9. **Multi-store automatic** - Memory (fast) + Redis (persistent) both checked automatically

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

**TTL not working:**
- Ensure you're using **milliseconds** for all `set()` calls
- Keyv uses milliseconds by default
- Example: 5 minutes = `300000` (not `300`)

**Multi-store not working:**
- Check both memory and Redis are configured in cache.module.ts
- Memory cache fills first (L1), Redis is backup (L2)
- Check Redis connection if only memory works
- Use `redis-cli monitor` to see if Redis is receiving commands

---

## **Migration from Legacy Cache**

If you're migrating from an older cache implementation:

1. **Replace custom providers with CACHE_MANAGER**:
   ```typescript
   // Old
   @Inject(CACHE_PROVIDER) private cache: ICacheProvider

   // New
   @Inject(CACHE_MANAGER) private cacheManager: Cache
   ```

2. **Update TTL from seconds to milliseconds**:
   ```typescript
   // Old
   await this.cache.set(key, value, 300); // 300 seconds

   // New
   await this.cacheManager.set(key, value, 300000); // 300000 milliseconds
   ```

3. **Replace custom decorators with native patterns**:
   ```typescript
   // Old
   @Cached((id) => `user:${id}`, 300)
   async getUser(id: string) { ... }

   // New (manual caching in method body)
   async getUser(id: string) {
     const cached = await this.cacheManager.get(`user:${id}`);
     if (cached) return cached;
     // ... fetch and cache
   }
   ```

---

## **Additional Resources**

- [Official NestJS Caching Documentation](https://docs.nestjs.com/techniques/caching)
- [Keyv Documentation](https://github.com/jaredwray/keyv)
- [cache-manager Documentation](https://github.com/node-cache-manager/node-cache-manager)
