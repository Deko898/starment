import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { isProd } from '@starment/config';
import { RequestUser } from '@starment/shared';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

import { DbError, DomainError } from '../error';

// Response sent to client
interface ErrorBody {
  statusCode: number;
  error: string | number;
  message: string;
  code?: string | number; // Specific error code for FE handling
  path: string;
  method: string;
  requestId?: string;
  timestamp: string; // ISO
  details?: unknown; // optional structured details
}

// Internal logging payload (includes more debug info)
interface ErrorLogPayload {
  err?: unknown;
  requestId?: string;
  userId?: string;
  path: string;
  method: string;
  status: number;
  controller?: string;
  handler?: string;
  duration?: number;
  details?: unknown;
}

// Type guard for objects with status property
function hasStatusProperty(obj: unknown): obj is { status: number } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'status' in obj &&
    typeof (obj as Record<string, unknown>).status === 'number'
  );
}

// Type guard for objects with code property
function hasCodeProperty(obj: unknown): obj is { code: string | number } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'code' in obj &&
    (typeof (obj as Record<string, unknown>).code === 'string' ||
      typeof (obj as Record<string, unknown>).code === 'number')
  );
}

// Type guard for objects with constructor
function hasConstructor(obj: unknown): obj is { constructor: { name: string } } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'constructor' in obj &&
    typeof (obj as Record<string, unknown>).constructor === 'object' &&
    'name' in ((obj as Record<string, unknown>).constructor as object)
  );
}

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GlobalHttpExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { id?: string; user?: RequestUser; startTime?: number }>();

    // Safely extract controller and handler names
    const controllerInstance: unknown = host.getArgByIndex(1);
    const controller: string | undefined = hasConstructor(controllerInstance)
      ? controllerInstance.constructor.name
      : undefined;

    const handlerFunc: unknown = host.getArgByIndex(2);
    const handler: string | undefined =
      typeof handlerFunc === 'function' ? handlerFunc.name : undefined;

    const path = req.originalUrl;
    const method = req.method;
    // req.id is set by RequestTracingMiddleware, but may not be present if error occurs before middleware
    const requestId: string | undefined = req.id || (req.headers['x-request-id'] as string);
    const userId = req.user?.id ?? 'anonymous';
    const duration = req.startTime ? Date.now() - req.startTime : undefined;

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorName: string | number = 'InternalServerError';
    let details: unknown;

    if (exception instanceof DbError) {
      status = exception.status;
      message = exception.message;
      errorName = exception.code || 'DB_ERROR';
      details = exception.details;

      // Add hint if available
      if (exception.hint) {
        details =
          typeof details === 'object'
            ? { ...details, hint: exception.hint }
            : { hint: exception.hint };
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === 'string') {
        message = resp;
        errorName = exception.name;
      } else if (typeof resp === 'object') {
        const r = resp as Record<string, unknown>;
        message = (r.message as string) || exception.message || message;
        errorName = (r.error as string) || exception.name || errorName;
        const code = r.code;

        // Extract details without the standard fields
        const { message: msg, error: err, statusCode: sc, code: c, ...rest } = r;
        // Suppress unused variable warnings for destructured values
        void msg;
        void err;
        void sc;
        void c;

        if (Object.keys(rest).length > 0) {
          details = rest;
        }

        // preserve code if it's distinct
        if (code && !hasCodeProperty(details)) {
          details = {
            ...(details as Record<string, unknown> | undefined),
            code,
          };
        }
      }
    } else if (exception instanceof DomainError) {
      status = exception.status;
      message = exception.message;
      errorName = exception.code;
      details = exception.details;
    } else if (exception instanceof Error) {
      message = exception.message || message;
      errorName = exception.name || errorName;

      // Try to extract status and code from error-like objects
      if (hasStatusProperty(exception)) {
        status = exception.status;
      }
      if (hasCodeProperty(exception) && !details) {
        details = { code: exception.code };
      }
    }

    // Extract error code for FE handling
    let errorCode: string | number | undefined;
    if (hasCodeProperty(details)) {
      errorCode = details.code;
    }

    // Response body for client (clean, FE-friendly)
    const body: ErrorBody = {
      statusCode: status,
      error: errorName,
      message,
      ...(errorCode ? { code: errorCode } : {}),
      path,
      method,
      ...(requestId ? { requestId } : {}),
      timestamp: new Date().toISOString(),
      ...(details ? { details } : {}),
    };

    // Log structured error with internal context
    const logPayload: ErrorLogPayload = {
      err: isProd() ? undefined : exception,
      requestId,
      userId,
      path,
      method,
      status,
      controller,
      handler,
      duration,
      details,
    };

    if (status >= 500) {
      this.logger.error(logPayload, message);
    } else if (status >= 400) {
      this.logger.warn(logPayload, message);
    } else {
      this.logger.info(logPayload, message);
    }

    // Echo request ID
    if (requestId && !res.getHeader('x-request-id')) {
      res.setHeader('x-request-id', requestId);
    }

    res.status(status).json(body);
  }
}
