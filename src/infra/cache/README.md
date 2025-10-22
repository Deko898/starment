# Cache Module

Redis caching layer for Starment API following official NestJS patterns.

## Architecture

This implementation uses **NestJS cache-manager** (official caching solution) with Redis store:

```
src/infra/cache/
├── interfaces/          # Provider-agnostic interfaces (custom abstraction)
│   └── cache-provider.interface.ts
├── adapters/            # Wrapper around NestJS cache-manager
│   └── redis-cache.adapter.ts
├── config/              # Module configuration
│   └── cache.module.ts
└── decorators/          # Custom utility decorators (optional)
    └── cached.decorator.ts
```

**Important**: Uses `cache-manager v5` which uses **milliseconds** for TTL (breaking change from v4).

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

## **🎯 Recommended: Official NestJS Approach**

### Auto-Caching HTTP Routes

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
  @CacheTTL(20) // Override TTL to 20 seconds (cache-manager v5 uses milliseconds internally)
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
@CacheTTL(30) // All routes cached for 30 seconds
export class ProductsController {
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @CacheTTL(60) // Override: 60 seconds for this route
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

### Custom Cache Keys

Override default route-based keys:

```typescript
import { CacheInterceptor, CacheKey } from '@nestjs/cache-manager';

@Controller('posts')
@UseInterceptors(CacheInterceptor)
export class PostsController {
  @Get(':id')
  @CacheKey('post_detail') // Static key
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  // For dynamic keys, extend CacheInterceptor and override trackBy()
}
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

## **Manual Cache Management in Services**

### Option 1: Direct CACHE_MANAGER Injection (NestJS Official)

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

    // Store in cache (TTL in milliseconds for cache-manager v5)
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

### Option 2: Custom ICacheProvider Abstraction (Provider-Agnostic)

For code that might switch cache providers:

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

    const cached = await this.cache.get<User>(cacheKey);
    if (cached) return cached;

    const user = await this.userRepo.findById(userId);

    // TTL in seconds (converted to ms internally)
    await this.cache.set(cacheKey, user, 300);

    return user;
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
  let product = await this.cache.get<Product>(key);

  // 2. Cache miss - fetch from DB
  if (!product) {
    product = await this.productRepo.findById(id);

    // 3. Store in cache
    await this.cache.set(key, product, 600); // 10 minutes
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
  await this.cache.set(`product:${id}`, product, 600);

  return product;
}
```

### Pattern 3: Cache Invalidation

```typescript
async deleteProduct(id: string): Promise<void> {
  // 1. Delete from database
  await this.productRepo.delete(id);

  // 2. Invalidate cache
  await this.cache.del(`product:${id}`);
  await this.cache.del(`products:list`); // Also clear list cache
}
```

### Pattern 4: Bulk Operations

```typescript
// Get multiple users
const users = await this.cache.mget<User>('user:1', 'user:2', 'user:3');

// Set multiple values
await this.cache.mset([
  { key: 'user:1', value: user1, ttl: 300 },
  { key: 'user:2', value: user2, ttl: 300 },
]);
```

### Pattern 5: Rate Limiting

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

---

## **Custom Decorators (Optional)**

We provide custom decorators for cleaner service code:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_PROVIDER, ICacheProvider, Cached, CacheInvalidate } from '@starment/cache';

@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_PROVIDER) private readonly cache: ICacheProvider,
  ) {}

  // Automatically cache method result
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

**Note**: These require `cache` property injected as `CACHE_PROVIDER`.

---

## **API Reference**

### CACHE_MANAGER Methods (Official)

```typescript
interface Cache {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  reset(): Promise<void>;
  wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T>;
}
```

### ICacheProvider Methods (Custom Abstraction)

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
  delPattern(pattern: string): Promise<void>;

  // Numeric operations
  incr(key: string, delta?: number): Promise<number>;
  decr(key: string, delta?: number): Promise<number>;

  // Utility
  ttl(key: string): Promise<number>;
}
```

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
3. **Use namespaced keys** - Avoid collisions
4. **Cache immutable data longer** - Static data can have higher TTL
5. **Invalidate on writes** - Clear cache when data changes
6. **Monitor cache hit rate** - Optimize what you cache
7. **Handle cache failures gracefully** - App should work without cache
8. **Remember: cache-manager v5 uses milliseconds** - `set(key, value, 60000)` = 60 seconds

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

**TTL not working:**
- Ensure you're using milliseconds for direct `CACHE_MANAGER` calls
- Use seconds for `CACHE_PROVIDER` (converted internally)
- cache-manager v5 changed from seconds to milliseconds

---

## **Migration from cache-manager v4 to v5**

If upgrading from v4:

- **Change**: TTL now in milliseconds instead of seconds
- **Before**: `set(key, value, 300)` = 300 seconds
- **After**: `set(key, value, 300)` = 300 milliseconds
- **Fix**: Multiply by 1000: `set(key, value, 300 * 1000)` = 300 seconds

Our `CACHE_PROVIDER` abstraction handles this conversion for you.
