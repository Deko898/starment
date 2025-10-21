/**
 * Supabase DAO Module
 *
 * A clean, database-agnostic data access layer built on top of Supabase.
 * Organized into logical submodules for better maintainability:
 *
 * - core/      : Database-agnostic abstractions (BaseRepository, Entity, adapters)
 * - supabase/  : Supabase-specific implementations
 * - config/    : NestJS modules and dependency injection setup
 * - hooks/     : Repository lifecycle hooks
 * - types/     : TypeScript type definitions
 */

// Core abstractions (database-agnostic)
export * from './core';

// Supabase implementation
export * from './supabase';

// Configuration & DI
export * from './config';

// Hooks
export * from './hooks';

// Types
export type * from './types';

// Re-export Supabase types for convenience
export type {
  PostgrestError,
  PostgrestResponse,
  PostgrestSingleResponse,
  Session,
  SupabaseClient,
} from '@supabase/supabase-js';
