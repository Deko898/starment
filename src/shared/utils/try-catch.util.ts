import { DomainError } from '@starment/core';
import { AuthApiError, PostgrestError } from '@supabase/supabase-js';

/**
 * Result type with discriminated union (like Supabase)
 * - If error exists, data is null
 * - If data exists, error is null
 */
export type TryCatchResult<T> = { data: T; error: null } | { data: null; error: DomainError };

/**
 * Executes an async function and safely captures any thrown errors.
 * Returns a Supabase-style discriminated union: { data, error }
 *
 * Usage:
 *   const { data, error } = await tryCatch(async () => fetchUser());
 *   if (error) throw error; // TypeScript knows data is null here
 *   return data; // TypeScript knows error is null here
 */
export async function tryCatch<T>(fn: () => Promise<T>): Promise<TryCatchResult<T>> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (err: unknown) {
    const error = normalizeError(err);

    return { data: null, error };
  }
}

/**
 * Synchronous variant of tryCatch for non-async operations.
 */
export function tryCatchSync<T>(fn: () => T): TryCatchResult<T> {
  try {
    const data = fn();
    return { data, error: null };
  } catch (err: unknown) {
    const error = normalizeError(err);

    return { data: null, error };
  }
}

export function normalizeError(err: unknown): DomainError {
  // 1️⃣ Already normalized
  if (err instanceof DomainError) {
    return err;
  }

  // 2️⃣ Supabase Auth errors
  if (err instanceof AuthApiError) {
    return new DomainError(err.message, err.code ?? 'AUTH_ERROR', err.status, {
      type: 'AuthApiError',
      code: err.code,
      status: err.status,
    });
  }

  // 3️⃣ Supabase PostgREST errors
  if (err instanceof PostgrestError) {
    const e = err as PostgrestError & { status?: number };
    return new DomainError(e.message, e.code, e.status ?? 400, {
      type: 'PostgrestError',
      code: e.code,
      details: e.details,
      hint: e.hint,
    });
  }

  // 4️⃣ Structured errors with code/status (e.g., other external errors)
  if (typeof err === 'object' && err && 'code' in err && 'message' in err) {
    const e = err as {
      code?: string | number;
      message?: string;
      status?: number;
    };
    const status = e.status ?? 500;
    const code = e.code ?? 'EXTERNAL_ERROR';

    return new DomainError(e.message ?? 'External provider error', code, status, {
      type: 'ExternalError',
      ...err,
    });
  }

  // 5️⃣ Generic JavaScript errors
  if (err instanceof Error) {
    return new DomainError(err.message, 'UNEXPECTED_ERROR', 500, {
      type: err.name,
      stack: err.stack,
    });
  }

  // 6️⃣ Anything else (string, number, null, etc.)
  return new DomainError('Unknown error occurred', 'UNKNOWN_ERROR', 500, {
    type: 'Unknown',
    original: err,
  });
}
