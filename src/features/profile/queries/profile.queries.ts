/**
 * Supabase query fragments for profile operations
 */

/**
 * Base profile fields
 */
export const PROFILE_FIELDS = `
  id,
  user_type,
  role,
  display_name,
  bio,
  country_code,
  phone,
  date_of_birth,
  avatar_url,
  city
` as const;

/**
 * Creator profile nested fields
 */
export const CREATOR_PROFILE_FIELDS = `
  creator_profile(
    legal_name,
    largest_following_platform,
    social_handle,
    follower_count
  )
` as const;

/**
 * Creator commercial nested fields
 */
export const CREATOR_COMMERCIAL_FIELDS = `
  creator_commercial(
    onboarding_status,
    creator_status
  )
` as const;

/**
 * Full creator profile query with all relations
 */
export const CREATOR_PROFILE_QUERY = `
  ${PROFILE_FIELDS},
  ${CREATOR_PROFILE_FIELDS},
  ${CREATOR_COMMERCIAL_FIELDS}
` as const;
