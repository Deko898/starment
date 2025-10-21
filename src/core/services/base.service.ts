import { NotFoundException } from '@nestjs/common';
import type { DbArrayResponse, DbSingleResponse } from '@starment/supabase';

import type { DbError } from '../error';

/**
 * Base service with error handling utilities
 * Can be used by any service (API, workers, cron jobs, etc.)
 */
export abstract class BaseService {
  /**
   * Unwrap a single response
   */
  protected unwrap<T>(result: DbSingleResponse<T>, resourceName?: string): T;

  /**
   * Unwrap an array response
   */
  protected unwrap<T>(result: DbArrayResponse<T>, resourceName?: string): T[];

  /**
   * Implementation
   */
  protected unwrap<T>(
    result: DbSingleResponse<T> | DbArrayResponse<T>,
    resourceName?: string,
  ): T | T[] {
    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      throw new NotFoundException(
        resourceName ? `${resourceName} not found` : 'Resource not found',
      );
    }

    return result.data;
  }

  /**
   * Unwrap single or null
   */
  protected unwrapOrNull<T>(result: DbSingleResponse<T>): T | null;

  /**
   * Unwrap array or null
   */
  protected unwrapOrNull<T>(result: DbArrayResponse<T>): T[] | null;

  /**
   * Implementation
   */
  protected unwrapOrNull<T>(result: DbSingleResponse<T> | DbArrayResponse<T>): T | T[] | null {
    if (result.error) {
      throw result.error;
    }

    return result.data;
  }

  /**
   * Unwrap array or return empty array
   */
  protected unwrapOrEmpty<T>(result: DbArrayResponse<T>): T[] {
    if (result.error) {
      throw result.error;
    }

    return result.data ?? [];
  }

  /**
   * Check if response has data (type guard)
   */
  protected hasData<T>(result: DbSingleResponse<T>): result is { data: T; error: null };

  protected hasData<T>(result: DbArrayResponse<T>): result is { data: T[]; error: null };

  protected hasData<T>(result: DbSingleResponse<T> | DbArrayResponse<T>): boolean {
    return result.data !== null && !result.error;
  }

  /**
   * Check if response has error (type guard)
   */
  protected hasError<T>(
    result: DbSingleResponse<T> | DbArrayResponse<T>,
  ): result is { data: null; error: DbError } {
    return result.error !== null;
  }
}
