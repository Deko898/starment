import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  ConflictException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { CACHE_PROVIDER, ICacheProvider } from '@starment/cache';
import * as crypto from 'crypto';
import { IDEMPOTENCY_CONFIG_KEY } from '../decorators/idempotent.decorator';

/**
 * Idempotency configuration for the interceptor
 */
export interface IdempotencyConfig {
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
   * Whether to auto-generate keys based on request fingerprint
   * If false, requires client to send Idempotency-Key header
   * Default: false
   */
  autoGenerateKey?: boolean;

  /**
   * HTTP methods to apply idempotency to
   * Default: ['POST', 'PUT', 'PATCH']
   */
  methods?: string[];
}

/**
 * Stored idempotency data
 */
interface IdempotencyData {
  statusCode: number;
  body: any;
  headers?: Record<string, string>;
  timestamp: number;
}

/**
 * Request deduplication interceptor using idempotency keys.
 *
 * Prevents duplicate requests from being processed multiple times by:
 * 1. Checking for Idempotency-Key header (or auto-generating based on request fingerprint)
 * 2. Caching successful responses
 * 3. Returning cached responses for duplicate requests
 *
 * Use with @Idempotent() decorator for easy application.
 *
 * Client usage:
 * ```
 * POST /api/orders
 * Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
 * ```
 *
 * Benefits:
 * - Prevents double-clicks from creating duplicate records
 * - Handles network retries safely
 * - Protects against race conditions
 * - Industry-standard pattern (used by Stripe, PayPal, etc.)
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly defaultConfig: Required<IdempotencyConfig> = {
    ttl: 86400, // 24 hours
    headerName: 'Idempotency-Key',
    autoGenerateKey: false,
    methods: ['POST', 'PUT', 'PATCH'],
  };

  constructor(
    @Inject(CACHE_PROVIDER) private readonly cache: ICacheProvider,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Get config from decorator metadata
    const decoratorConfig = this.reflector.get<IdempotencyConfig>(
      IDEMPOTENCY_CONFIG_KEY,
      context.getHandler(),
    ) || {};

    const finalConfig = { ...this.defaultConfig, ...decoratorConfig };

    // Only apply to configured methods
    if (!finalConfig.methods.includes(request.method)) {
      return next.handle();
    }

    // Get or generate idempotency key
    const idempotencyKey = this.getIdempotencyKey(request, finalConfig);

    if (!idempotencyKey) {
      // No key provided and auto-generation disabled
      return next.handle();
    }

    const cacheKey = `idempotency:${idempotencyKey}`;

    // Check if we've seen this request before
    const cached = await this.cache.get<IdempotencyData>(cacheKey);

    if (cached) {
      // Return cached response
      response.status(cached.statusCode);

      // Set cached headers
      if (cached.headers) {
        Object.entries(cached.headers).forEach(([key, value]) => {
          response.setHeader(key, value);
        });
      }

      // Add header to indicate this is a cached response
      response.setHeader('X-Idempotency-Replay', 'true');

      return of(cached.body);
    }

    // Mark this key as "in-progress" to handle concurrent requests
    const lockKey = `idempotency:lock:${idempotencyKey}`;
    const hasLock = await this.cache.has(lockKey);

    if (hasLock) {
      // Another request with same key is currently processing
      throw new ConflictException(
        'A request with this idempotency key is currently being processed. Please retry in a few seconds.',
      );
    }

    // Set lock (short TTL - 60 seconds for processing)
    await this.cache.set(lockKey, true, 60);

    // Process the request and cache the response
    return next.handle().pipe(
      tap({
        next: async (data) => {
          // Cache successful response
          const idempotencyData: IdempotencyData = {
            statusCode: response.statusCode || HttpStatus.OK,
            body: data,
            timestamp: Date.now(),
          };

          await this.cache.set(cacheKey, idempotencyData, finalConfig.ttl);

          // Remove lock
          await this.cache.del(lockKey);

          // Add header to indicate this is the original response
          response.setHeader('X-Idempotency-Replay', 'false');
        },
        error: async () => {
          // On error, remove lock but don't cache
          await this.cache.del(lockKey);
        },
      }),
    );
  }

  /**
   * Get idempotency key from request
   */
  private getIdempotencyKey(request: Request, config: Required<IdempotencyConfig>): string | null {
    // Check header first
    const headerKey = request.headers[config.headerName.toLowerCase()] as string;
    if (headerKey) {
      return headerKey;
    }

    // Auto-generate if enabled
    if (config.autoGenerateKey) {
      return this.generateRequestFingerprint(request);
    }

    return null;
  }

  /**
   * Generate a fingerprint based on request content
   * Uses: method + path + body + user ID (if authenticated)
   */
  private generateRequestFingerprint(request: Request): string {
    const components = [
      request.method,
      request.path,
      JSON.stringify(request.body || {}),
      (request as any).user?.id || 'anonymous', // Include user ID if authenticated
    ];

    const fingerprint = components.join('|');

    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }
}
