/**
 * Base domain-level error
 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string | number = 'DOMAIN_ERROR',
    public readonly status = 400,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

/**
 * Database-specific error that extends DomainError
 * Includes database-specific fields like hint
 */
export class DbError extends DomainError {
  constructor(
    message: string,
    code?: string,
    status?: number,
    details?: unknown,
    public readonly hint?: string,
  ) {
    super(message, code ?? 'DB_ERROR', status ?? 500, details);
    this.name = 'DbError';
  }
}

/**
 * Domain errors
 */
export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    super(`${resource} not found`, 'RESOURCE_NOT_FOUND', 404, { resource, id });
  }
}

export class ValidationError extends DomainError {
  constructor(field: string, reason: string) {
    super(`Validation failed: ${field}`, 'VALIDATION_ERROR', 422, {
      field,
      reason,
    });
  }
}
