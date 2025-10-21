import type { DbError } from '@starment/core';

import type { Entity, InsertOf, RowOf, UpdateOf } from './schema.types';

/**
 * Generic database response wrapper
 * Can represent success or error from any database provider
 */
export interface DbResponse<T> {
  data: T | null;
  error: DbError | null;
  count?: number | null;
  status?: number;
}

/**
 * Single record response type
 */
export type DbSingleResponse<T> = DbResponse<T>;

/**
 * Multiple records response type
 */
export type DbArrayResponse<T> = DbResponse<T[]>;

export interface FindManyOptions<Row extends Record<string, unknown>> {
  where?: Partial<Row>;
  ilike?: Partial<Record<string, string>>;
  orderBy?: Partial<Record<string, 'asc' | 'desc'>>;
  limit?: number;
  offset?: number;
  columns?: string;
}

/**
 * Database adapter - now uses Entity type directly!
 */
export interface DatabaseAdapter<TEntity extends Entity> {
  findById: (
    id: string | number,
    opts?: { idColumn?: keyof RowOf<TEntity>; columns?: string },
  ) => Promise<DbSingleResponse<RowOf<TEntity>>>;

  findMany: (opts?: FindManyOptions<RowOf<TEntity>>) => Promise<DbArrayResponse<RowOf<TEntity>>>;

  insertOne: (
    payload: InsertOf<TEntity>,
    columns?: string,
  ) => Promise<DbSingleResponse<RowOf<TEntity>>>;

  upsertOne: (
    payload: InsertOf<TEntity>,
    conflictTarget?: string,
    columns?: string,
  ) => Promise<DbSingleResponse<RowOf<TEntity>>>;

  updateById: (
    id: string | number,
    patch: UpdateOf<TEntity>,
    opts?: { idColumn?: keyof RowOf<TEntity>; columns?: string },
  ) => Promise<DbSingleResponse<RowOf<TEntity>>>;

  deleteById: (
    id: string | number,
    opts?: { idColumn?: keyof RowOf<TEntity> },
  ) => Promise<DbResponse<null>>;

  rpc: <T = unknown>(name: string, args?: unknown) => Promise<DbSingleResponse<T>>;

  exists: (where: Partial<RowOf<TEntity>>) => Promise<boolean>;

  count: (where?: Partial<RowOf<TEntity>>) => Promise<number>;
}

export interface RepositoryHooks<Row, Insert, Update> {
  beforeInsert?: (payload: Insert) => Promise<Insert> | Insert;
  afterInsert?: (data: Row) => Promise<void> | void;
  beforeUpdate?: (patch: Update) => Promise<Update> | Update;
  afterUpdate?: (data: Row) => Promise<void> | void;
}
