/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */

import type { Database } from '../types';

export type AppSchema = Database['public']['Tables'];

/**
 * Entity definition with all CRUD types bundled together
 * This is the key to single-parameter generics!
 */
export interface Entity<TRow = any, TInsert = Partial<TRow>, TUpdate = Partial<TRow>> {
  Row: TRow;
  Insert: TInsert;
  Update: TUpdate;
}

/**
 * Helper to create entity type from schema table
 */
export type EntityFromSchema<TName extends keyof AppSchema> = Entity<
  AppSchema[TName]['Row'],
  AppSchema[TName]['Insert'],
  AppSchema[TName]['Update']
>;

// ============================================
// Helper types - Extract from Entity
// ============================================

/**
 * Extract Row type from Entity
 */
export type RowOf<TEntity extends Entity> = TEntity['Row'];

/**
 * Extract Insert type from Entity
 */
export type InsertOf<TEntity extends Entity> = TEntity['Insert'];

/**
 * Extract Update type from Entity
 */
export type UpdateOf<TEntity extends Entity> = TEntity['Update'];

// ============================================
// Domain Entities - Clean & Simple
// ============================================

export type Profile = EntityFromSchema<'profiles'>;
export type CreatorProfile = EntityFromSchema<'creator_profile'>;
export type CreatorCommercial = EntityFromSchema<'creator_commercial'>;
export type HealthCheck = EntityFromSchema<'health_check'>;

export type Category = EntityFromSchema<'categories'>;
export type Product = EntityFromSchema<'products'>;
export type Order = EntityFromSchema<'orders'>;
export type ChatMessage = EntityFromSchema<'chat_messages'>;
export type ChatSession = EntityFromSchema<'chat_sessions'>;

// For convenience, also export the Row types directly
export type ProfileData = RowOf<Profile>;
export type CreatorProfileData = RowOf<CreatorProfile>;
export type CreatorCommercialData = RowOf<CreatorCommercial>;
export type HealthCheckData = RowOf<HealthCheck>;
export type CategoryData = RowOf<Category>;
export type ProductData = RowOf<Product>;
export type OrderData = RowOf<Order>;
