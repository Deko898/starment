import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestTracingMiddleware implements NestMiddleware {
  use(req: Request & { id?: string; startTime?: number }, res: Response, next: NextFunction): void {
    // ✅ Generate or reuse request ID
    const existingId =
      req.id || (req.headers['x-request-id'] as string | undefined) || randomUUID();

    req.id = existingId;
    req.startTime = Date.now();

    // ✅ Ensure header exists for downstream services
    if (!res.getHeader('x-request-id')) {
      res.setHeader('x-request-id', existingId);
    }

    next();
  }
}
