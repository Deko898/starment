# Idempotency Module

Request deduplication for Starment API to prevent duplicate actions from multiple identical requests.

## Problem

**Without idempotency protection**, these scenarios can cause problems:

1. **Double-clicks** - User clicks "Submit" twice, creating duplicate orders
2. **Network retries** - Client retries on timeout, triggering action twice
3. **Race conditions** - Multiple requests sent simultaneously
4. **Malicious spam** - Attackers flood endpoints with duplicate requests

**With idempotency**, the same request is processed only once, and subsequent identical requests return the cached response.

---

## Solution

Industry-standard **idempotency key** pattern (used by Stripe, PayPal, AWS, etc.):

1. Client sends unique `Idempotency-Key` header with each request
2. Server caches the response for that key (24 hours default)
3. Duplicate requests with same key return cached response
4. Headers indicate if response is original or replay

---

## Installation

### Module Already Imported

`IdempotencyModule` is already imported in `AppModule` globally.

### Dependencies

Uses existing `@starment/cache` infrastructure (no additional setup needed).

---

## Usage

## **🎯 Basic Usage**

### Apply to Route

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { Idempotent } from '@starment/idempotency';

@Controller('orders')
export class OrdersController {

  @Post()
  @Idempotent() // Requires client to send Idempotency-Key header
  async createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }
}
```

**Client Usage:**
```bash
# First request - processes normally
curl -X POST https://api.starment.com/v1/orders \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{"productId": "123", "quantity": 2}'

# Response:
HTTP/1.1 201 Created
X-Idempotency-Replay: false
{"orderId": "ord_123", "status": "created"}

# Duplicate request (same key) - returns cached response
curl -X POST https://api.starment.com/v1/orders \
  -H "Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{"productId": "123", "quantity": 2}'

# Response (from cache, no duplicate order created):
HTTP/1.1 201 Created
X-Idempotency-Replay: true
{"orderId": "ord_123", "status": "created"}
```

---

## **Advanced Usage**

### Auto-Generate Keys (Fingerprinting)

If you don't want to require clients to send keys:

```typescript
@Post()
@Idempotent({ autoGenerateKey: true })
async createOrder(@Body() dto: CreateOrderDto) {
  return this.ordersService.create(dto);
}
```

**How it works:**
- Generates fingerprint based on: `method + path + body + userId`
- Same request content → same key → deduplicated
- Different content → different key → allowed

**Pros:**
- Simpler client implementation
- No need to generate UUIDs

**Cons:**
- Less control (can't force-retry with new key)
- Relies on request content being identical

---

### Custom TTL

```typescript
@Post('payments')
@Idempotent({ ttl: 3600 }) // Cache for 1 hour (3600 seconds)
async processPayment(@Body() dto: PaymentDto) {
  return this.paymentsService.process(dto);
}
```

**Default TTL:** 24 hours (86400 seconds)

**Recommendation:**
- **Payments**: 1-24 hours
- **Orders**: 24 hours
- **Webhooks**: 1 hour
- **User actions**: 5-10 minutes

---

### Custom Header Name

```typescript
@Post()
@Idempotent({ headerName: 'X-Request-ID' })
async createOrder(@Body() dto: CreateOrderDto) {
  return this.ordersService.create(dto);
}
```

Client sends:
```bash
curl -H "X-Request-ID: my-unique-id-123" ...
```

---

### Controller-Level Idempotency

Apply to all POST/PUT/PATCH routes in controller:

```typescript
@Controller('orders')
@Idempotent({ autoGenerateKey: true })
export class OrdersController {

  @Post()
  createOrder(@Body() dto: CreateOrderDto) {
    // Automatically idempotent
    return this.ordersService.create(dto);
  }

  @Put(':id')
  updateOrder(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    // Automatically idempotent
    return this.ordersService.update(id, dto);
  }

  @Get() // Not affected (only POST/PUT/PATCH by default)
  listOrders() {
    return this.ordersService.findAll();
  }
}
```

---

### Selective Methods

```typescript
@Post()
@Idempotent({
  methods: ['POST'], // Only POST (not PUT/PATCH)
  autoGenerateKey: true
})
async createOrder(@Body() dto: CreateOrderDto) {
  return this.ordersService.create(dto);
}
```

**Default methods:** `['POST', 'PUT', 'PATCH']`

---

## **Response Headers**

The interceptor adds headers to help clients understand the response:

| Header | Value | Meaning |
|--------|-------|---------|
| `X-Idempotency-Replay` | `false` | Original request (processed normally) |
| `X-Idempotency-Replay` | `true` | Duplicate request (cached response) |

**Client Usage:**
```typescript
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Idempotency-Key': uuid(),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(order)
});

if (response.headers.get('X-Idempotency-Replay') === 'true') {
  console.log('Duplicate request detected - no action taken');
} else {
  console.log('New request processed successfully');
}
```

---

## **Concurrent Requests**

If multiple identical requests arrive **simultaneously** (race condition):

1. First request gets a **lock** and processes
2. Other requests get `409 Conflict` response:
   ```json
   {
     "statusCode": 409,
     "message": "A request with this idempotency key is currently being processed. Please retry in a few seconds."
   }
   ```
3. Client should retry after a few seconds
4. Retry will get the cached response

**Lock TTL:** 60 seconds (protects against long-running operations)

---

## **Best Practices**

### 1. Generate UUIDs on Client

```typescript
// Frontend
import { v4 as uuidv4 } from 'uuid';

async function createOrder(orderData) {
  const idempotencyKey = uuidv4();

  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  });

  return response.json();
}
```

### 2. Store Keys for User Actions

```typescript
// Store in localStorage for retry scenarios
const key = localStorage.getItem('pendingOrderKey') || uuidv4();
localStorage.setItem('pendingOrderKey', key);

try {
  const order = await createOrder(orderData, key);
  localStorage.removeItem('pendingOrderKey'); // Success - clear key
} catch (error) {
  // Key still stored - retry will use same key
}
```

### 3. Use for Critical Operations

**Always use for:**
- ✅ Payment processing
- ✅ Order creation
- ✅ Money transfers
- ✅ Webhook processing
- ✅ User registration
- ✅ Subscription changes

**Don't use for:**
- ❌ Read-only GET requests
- ❌ Simple queries
- ❌ Idempotent-by-nature operations (e.g., `DELETE` with specific ID)

### 4. Set Appropriate TTL

```typescript
// Short-lived actions (5 minutes)
@Idempotent({ ttl: 300 })

// Medium-lived (1 hour)
@Idempotent({ ttl: 3600 })

// Critical operations (24 hours)
@Idempotent({ ttl: 86400 })
```

### 5. Handle Errors Properly

Idempotency only caches **successful** responses (2xx status codes).

If first request fails:
- Error is **not cached**
- Retry with same key will **process again**
- This is correct behavior (operation didn't succeed)

---

## **Common Patterns**

### Pattern 1: Webhook Processing

```typescript
@Controller('webhooks')
export class WebhooksController {

  @Post('stripe')
  @Idempotent({
    headerName: 'Stripe-Idempotency-Key',
    ttl: 3600 // 1 hour
  })
  async handleStripeWebhook(@Body() payload: any) {
    // Process webhook (only once even if Stripe retries)
    return this.webhooksService.processStripe(payload);
  }
}
```

### Pattern 2: Payment Processing

```typescript
@Post('payments')
@Idempotent({ ttl: 86400 }) // 24 hours
async processPayment(
  @Body() dto: PaymentDto,
  @Headers('idempotency-key') key: string
) {
  // Validate key is provided
  if (!key) {
    throw new BadRequestException('Idempotency-Key header is required for payments');
  }

  return this.paymentsService.process(dto);
}
```

### Pattern 3: Batch Operations

```typescript
@Post('orders/batch')
@Idempotent({ autoGenerateKey: true, ttl: 600 })
async createMultipleOrders(@Body() dto: CreateOrdersDto) {
  // Entire batch is idempotent
  return this.ordersService.createBatch(dto.orders);
}
```

---

## **How It Works Internally**

1. **Request arrives** with `Idempotency-Key: abc-123`
2. **Check cache**: `idempotency:abc-123`
   - Found → Return cached response
   - Not found → Continue
3. **Check lock**: `idempotency:lock:abc-123`
   - Locked → Return `409 Conflict` (concurrent request)
   - Not locked → Set lock (60s TTL)
4. **Process request** normally
5. **Cache response**: `idempotency:abc-123` (24h TTL)
6. **Remove lock**
7. **Return response** with `X-Idempotency-Replay: false`

**Subsequent requests** with same key:
1. **Check cache**: `idempotency:abc-123` → Found
2. **Return cached response** with `X-Idempotency-Replay: true`

---

## **Configuration Reference**

```typescript
interface IdempotencyConfig {
  /**
   * TTL for idempotency cache in seconds
   * Default: 86400 (24 hours)
   */
  ttl?: number;

  /**
   * Header name for idempotency key
   * Default: 'Idempotency-Key'
   */
  headerName?: string;

  /**
   * Auto-generate keys based on request fingerprint
   * Default: false (requires client to send key)
   */
  autoGenerateKey?: boolean;

  /**
   * HTTP methods to apply idempotency to
   * Default: ['POST', 'PUT', 'PATCH']
   */
  methods?: string[];
}
```

---

## **Testing**

### Test Idempotency Manually

```bash
# Generate UUID
KEY=$(uuidv4)

# First request
curl -X POST http://localhost:3000/v1/orders \
  -H "Idempotency-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"productId": "123"}'

# Duplicate request (should return cached response)
curl -X POST http://localhost:3000/v1/orders \
  -H "Idempotency-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"productId": "123"}'
```

Check `X-Idempotency-Replay` header in second response.

### E2E Test

```typescript
describe('Orders (e2e)', () => {
  it('should deduplicate identical requests', async () => {
    const idempotencyKey = uuid();
    const orderData = { productId: '123', quantity: 2 };

    // First request
    const response1 = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Idempotency-Key', idempotencyKey)
      .send(orderData)
      .expect(201);

    expect(response1.headers['x-idempotency-replay']).toBe('false');
    const orderId = response1.body.orderId;

    // Duplicate request
    const response2 = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Idempotency-Key', idempotencyKey)
      .send(orderData)
      .expect(201);

    expect(response2.headers['x-idempotency-replay']).toBe('true');
    expect(response2.body.orderId).toBe(orderId); // Same order

    // Verify only one order was created
    const orders = await ordersService.findAll();
    expect(orders).toHaveLength(1);
  });
});
```

---

## **Troubleshooting**

**Idempotency not working:**
- Check that `IdempotencyModule` is imported in `AppModule`
- Verify `@Idempotent()` decorator is applied
- Ensure request method is POST/PUT/PATCH
- Check cache is working (Redis connection)

**Getting 409 Conflict:**
- Two requests with same key sent simultaneously
- Wait a few seconds and retry
- First request is still processing

**Responses not cached:**
- Only successful responses (2xx) are cached
- Errors are not cached (correct behavior)
- Check TTL hasn't expired

**Wrong response returned:**
- Using same key for different requests
- Generate unique keys per logical operation
- Don't reuse keys across different actions

---

## **Performance Impact**

**Overhead per request:**
- ✅ 1-2 cache lookups (~1-3ms)
- ✅ 1 cache write on success (~2-5ms)
- ✅ **Total: ~5-10ms overhead**

**Benefits:**
- ✅ Prevents duplicate database writes
- ✅ Prevents duplicate external API calls
- ✅ Saves computation on retries
- ✅ Improves user experience

**Net result:** Small overhead for first request, massive savings on duplicates.

---

## **Security Considerations**

1. **Key collision** - Use UUIDs (128-bit) to avoid collisions
2. **Cache poisoning** - Keys are scoped per endpoint (different routes = different keys)
3. **Replay attacks** - TTL limits window (24h default)
4. **User isolation** - Auto-generated keys include user ID in fingerprint

---

## **Comparison with Alternatives**

| Approach | Pros | Cons |
|----------|------|------|
| **Idempotency Keys** | Industry standard, flexible, works across distributed systems | Requires client cooperation |
| **Database Constraints** | Server-side only, automatic | Database-specific, limited to unique constraints |
| **Client-side Debouncing** | Simple | Doesn't handle retries, race conditions, or multiple clients |
| **Transaction Locks** | Strong consistency | Performance impact, doesn't prevent retries |

**Recommendation:** Use idempotency keys for public APIs and critical operations. Combine with database constraints for defense in depth.

---

## **Additional Resources**

- [Stripe API Idempotency](https://stripe.com/docs/api/idempotent_requests)
- [AWS Idempotency Whitepaper](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)
- [RFC 7231 - HTTP Idempotent Methods](https://tools.ietf.org/html/rfc7231#section-4.2.2)
