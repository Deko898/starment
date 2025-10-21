/**
 * Supabase DAimport {
  type PostgrestResponse,
  type PostgrestSingleResponse,
  type SupabaseClient,
} from '@supabase/supabase-js';

import type {
  DatabaseAdapter,
  DbArrayResponse,
  DbResponse,
  DbSingleResponse,
} from '../core/data-adapter.types';
import { DbError } from '../core/data-adapter.types';
import type { Database } from '../types/database.types';
import { dbCall } from './supabase-dao.db-call'; ARCHITECTURAL NOTE:
 * This file intentionally uses `any` for the Supabase client because TypeScript cannot properly
 * infer Supabase's complex conditional types in generic contexts. This is a documented limitation.
 * All unsafe-* lint warnings in this file are expected and the runtime behavior is correct.
 *
 * The public API (DatabaseAdapter interface) remains fully type-safe for consumers.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-dynamic-delete */

import { DbError } from '@starment/core';
import {
  type PostgrestResponse,
  type PostgrestSingleResponse,
  type SupabaseClient,
} from '@supabase/supabase-js';

import type {
  DatabaseAdapter,
  DbArrayResponse,
  DbResponse,
  DbSingleResponse,
  Entity,
  RowOf,
} from '../core';
import type { Database, TableName } from '../types';
import { dbCall } from './supabase-dao.db-call';

/**
 * Columns to exclude from all query results by default
 * (internal/audit fields that FE doesn't need)
 */
const EXCLUDED_COLUMNS = ['created_at', 'updated_at', 'search_tsv'] as const;

/**
 * Removes internal columns from response data.
 * Overloaded signatures ensure type safety.
 */
function sanitizeResponse<T>(data: T): T;
function sanitizeResponse<T>(data: T[]): T[];
function sanitizeResponse(data: null): null;
function sanitizeResponse<T>(data: T | T[] | null): T | T[] | null {
  if (!data) {
    return data;
  }

  const removeInternalFields = (obj: unknown): unknown => {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const cleaned: Record<string, unknown> = { ...obj } as Record<string, unknown>;
    for (const col of EXCLUDED_COLUMNS) {
      delete cleaned[col];
    }

    // Recursively clean nested objects
    for (const key in cleaned) {
      if (cleaned[key] && typeof cleaned[key] === 'object') {
        if (Array.isArray(cleaned[key])) {
          cleaned[key] = (cleaned[key] as unknown[]).map(removeInternalFields);
        } else {
          cleaned[key] = removeInternalFields(cleaned[key]);
        }
      }
    }

    return cleaned;
  };

  if (Array.isArray(data)) {
    return data.map(removeInternalFields) as T[];
  }

  return removeInternalFields(data) as T;
}

/**
 * Converts Supabase PostgrestSingleResponse to generic DbSingleResponse
 */
function toDbSingleResponse<T>(supabaseResponse: PostgrestSingleResponse<T>): DbSingleResponse<T> {
  return {
    data: supabaseResponse.data,
    error: supabaseResponse.error
      ? new DbError(
          supabaseResponse.error.message,
          supabaseResponse.error.code,
          supabaseResponse.status,
          supabaseResponse.error.details,
          supabaseResponse.error.hint,
        )
      : null,
    status: supabaseResponse.status,
  };
}

/**
 * Converts Supabase PostgrestResponse to generic DbArrayResponse
 */
function toDbArrayResponse<T>(supabaseResponse: PostgrestResponse<T>): DbArrayResponse<T> {
  return {
    data: supabaseResponse.data,
    error: supabaseResponse.error
      ? new DbError(
          supabaseResponse.error.message,
          supabaseResponse.error.code,
          supabaseResponse.status,
          supabaseResponse.error.details,
          supabaseResponse.error.hint,
        )
      : null,
    count: supabaseResponse.count,
    status: supabaseResponse.status,
  } as DbArrayResponse<T>;
}

/**
 * Creates a type-safe Supabase table adapter.
 * Now uses Entity type directly - cleaner signature!
 */
export function makeAdapter<TEntity extends Entity>(
  client: SupabaseClient<Database>,
  table: TableName,
): DatabaseAdapter<TEntity> {
  // Supabase's types are too complex for generic contexts - intentional escape hatch
  const supabase = client as any;

  return {
    async findById(
      id,
      { idColumn = 'id', columns = '*' } = {},
    ): Promise<DbSingleResponse<RowOf<TEntity>>> {
      const result = await dbCall(
        () => supabase.from(table).select(columns).eq(idColumn, id).single(),
        { label: `${table}.findById` },
      );

      const dbResponse = toDbSingleResponse(result as PostgrestSingleResponse<RowOf<TEntity>>);
      return {
        ...dbResponse,
        data: sanitizeResponse(dbResponse.data),
      };
    },

    async findMany(q = {}): Promise<DbArrayResponse<RowOf<TEntity>>> {
      const result = await dbCall(
        () => {
          let query = supabase.from(table).select(q.columns ?? '*');

          if (q.where) {
            for (const [key, value] of Object.entries(q.where)) {
              if (value !== undefined) {
                query = query.eq(key, value);
              }
            }
          }

          if (q.ilike) {
            for (const [key, value] of Object.entries(q.ilike)) {
              query = query.ilike(key, value);
            }
          }

          if (q.orderBy) {
            for (const [key, direction] of Object.entries(q.orderBy)) {
              query = query.order(key, { ascending: direction === 'asc' });
            }
          }

          if (q.limit) {
            query = query.limit(q.limit);
          }

          if (typeof q.offset === 'number') {
            const to = q.offset + (q.limit ?? 100) - 1;
            query = query.range(q.offset, to);
          }

          return query;
        },
        { label: `${table}.findMany` },
      );

      const dbResponse = toDbArrayResponse<RowOf<TEntity>>(
        result as PostgrestResponse<RowOf<TEntity>>,
      );
      return {
        ...dbResponse,
        data: sanitizeResponse(dbResponse.data),
      };
    },

    async insertOne(payload, columns = '*'): Promise<DbSingleResponse<RowOf<TEntity>>> {
      const result = await dbCall(
        () => supabase.from(table).insert(payload).select(columns).single(),
        { label: `${table}.insertOne` },
      );

      const dbResponse = toDbSingleResponse(result as PostgrestSingleResponse<RowOf<TEntity>>);
      return {
        ...dbResponse,
        data: sanitizeResponse(dbResponse.data),
      };
    },

    async upsertOne(
      payload,
      conflictTarget,
      columns = '*',
    ): Promise<DbSingleResponse<RowOf<TEntity>>> {
      const options = conflictTarget ? { onConflict: conflictTarget } : {};
      const result = await dbCall(
        () => supabase.from(table).upsert(payload, options).select(columns).single(),
        { label: `${table}.upsertOne` },
      );

      const dbResponse = toDbSingleResponse(result as PostgrestSingleResponse<RowOf<TEntity>>);
      return {
        ...dbResponse,
        data: sanitizeResponse(dbResponse.data),
      };
    },

    async updateById(
      id,
      patch,
      { idColumn = 'id', columns = '*' } = {},
    ): Promise<DbSingleResponse<RowOf<TEntity>>> {
      const result = await dbCall(
        () => supabase.from(table).update(patch).eq(idColumn, id).select(columns).single(),
        { label: `${table}.updateById` },
      );

      const dbResponse = toDbSingleResponse(result as PostgrestSingleResponse<RowOf<TEntity>>);
      return {
        ...dbResponse,
        data: sanitizeResponse(dbResponse.data),
      };
    },

    async deleteById(id, { idColumn = 'id' } = {}): Promise<DbResponse<null>> {
      const result = await dbCall(() => supabase.from(table).delete().eq(idColumn, id), {
        label: `${table}.deleteById`,
      });
      return toDbSingleResponse<null>(result as PostgrestSingleResponse<null>);
    },

    async rpc(name, args): Promise<DbSingleResponse<any>> {
      const result = await dbCall(() => supabase.rpc(name, args), {
        label: `${table}.rpc:${name}`,
      });
      return toDbSingleResponse(result as PostgrestSingleResponse<any>);
    },

    async exists(where): Promise<boolean> {
      const q = this.findMany({ where, columns: 'id', limit: 1 });
      const { data, error } = await q;
      if (error) {
        throw error;
      }
      return Array.isArray(data) && data.length > 0;
    },

    async count(where?): Promise<number> {
      let qb = supabase.from(table).select('id', { count: 'exact', head: true });
      if (where) {
        for (const [k, v] of Object.entries(where)) {
          qb = qb.eq(k, v);
        }
      }
      const { count, error } = await qb;
      if (error) {
        throw error;
      }
      return count ?? 0;
    },
  };
}
