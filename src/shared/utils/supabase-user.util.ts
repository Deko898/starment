import type { UserGender } from '../enums';
import { Role, UserStatus, UserType } from '../enums';
import type { SupabaseUser } from '../interfaces';

/**
 * Utility functions for safe Supabase user metadata access
 */

/** Get primary role */
export function getRole(user: SupabaseUser): Role {
  return user.app_metadata.role || user.user_metadata.roles?.[0] || Role.USER;
}

/** Get type (fan / creator) */
export function getUserType(user: SupabaseUser): UserType {
  return user.user_metadata.user_type || UserType.FAN;
}

/** Get current status */
export function getStatus(user: SupabaseUser): UserStatus {
  return user.user_metadata.user_status || UserStatus.ACTIVE;
}

/** Get gender (optional) */
export function getGender(user: SupabaseUser): UserGender | undefined {
  return user.user_metadata.gender;
}

/** Get display name */
export function getDisplayName(user: SupabaseUser): string {
  return (
    user.user_metadata.display_name ||
    user.user_metadata.full_name ||
    `${user.user_metadata.first_name ?? ''} ${user.user_metadata.last_name ?? ''}`.trim() ||
    user.email ||
    'Unknown User'
  );
}

/** Check specific role */
export function hasRole(user: SupabaseUser, role: Role): boolean {
  return getRole(user) === role || user.user_metadata.roles?.includes(role) || false;
}

/** Check if user is admin */
export function isAdmin(user: SupabaseUser): boolean {
  return hasRole(user, Role.ADMIN);
}

/** Check if user is creator */
export function isCreator(user: SupabaseUser): boolean {
  return getUserType(user) === UserType.CREATOR;
}

/** Check if user is fan */
export function isFan(user: SupabaseUser): boolean {
  return getUserType(user) === UserType.FAN;
}
