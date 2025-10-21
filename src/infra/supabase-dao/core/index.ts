/**
 * Core database abstractions (database-agnostic)
 * These types work with any database implementation
 */
export * from './base.repository';
export type * from './data-adapter.types'; // Exports both types AND DbError class
export type * from './schema.types';
