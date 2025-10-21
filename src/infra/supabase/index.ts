/**
 * Supabase Module
 *
 * A clean, provider-agnostic layer built on top of Supabase.
 * Organized into logical submodules for better maintainability:
 *
 * - database/  : Database operations (DAO layer, repositories, adapters)
 * - auth/      : Authentication operations (login, register, validate)
 * - config/    : NestJS modules and dependency injection setup
 * - types/     : TypeScript type definitions
 */

// Database layer (DAO)
export * from './database';

// Auth layer
export * from './auth';

// Configuration & DI
export * from './config';

// Types
export type * from './types';

// Re-export Supabase types for convenience (should only be used in adapters)
export type {
  PostgrestError,
  PostgrestResponse,
  PostgrestSingleResponse,
  Session,
  SupabaseClient,
} from '@supabase/supabase-js';
