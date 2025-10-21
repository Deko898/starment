import type { Role, UserType } from '@starment/shared';

/**
 * Base Profile data (explicit fields we query)
 */
export interface ProfileData {
  id: string;
  user_type: UserType;
  role: Role;
  display_name: string;
  bio: string | null;
  country_code: string;
  phone: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  city: string | null;
}

/**
 * Creator Profile details (nested relation)
 */
export interface CreatorProfileData {
  legal_name: string | null;
  largest_following_platform: string | null;
  social_handle: string | null;
  follower_count: number | null;
}

/**
 * Creator Commercial details (nested relation)
 */
export interface CreatorCommercialData {
  onboarding_status: string | null;
  creator_status: string | null;
}

/**
 * Full Creator Profile with nested relations
 * This represents the response from getCreatorProfile which includes:
 * - Base profile data
 * - creator_profile relation (array from Supabase)
 * - creator_commercial relation (array from Supabase)
 */
export interface CreatorProfileWithRelations extends ProfileData {
  creator_profile: CreatorProfileData[] | null;
  creator_commercial: CreatorCommercialData[] | null;
}
