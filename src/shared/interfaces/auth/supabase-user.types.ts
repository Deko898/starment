import type { UserGender } from '../../enums';
import type { Role, UserStatus, UserType } from '../../enums';

/**
 * Represents the fields Supabase manages internally (JWT, provider info, etc.)
 */
export interface SupabaseAppMetadata {
  provider: string;
  providers: string[];
  role?: Role; // 'user' | 'admin'
  [key: string]: unknown;
}

/**
 * Represents your own user-defined metadata stored during sign-up.
 * (This data comes from options.data in signUp())
 */
export interface SupabaseUserMetadata {
  display_name?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  country_code?: string;

  user_type?: UserType; // 'fan' | 'creator'
  user_status?: UserStatus; // 'active' | 'suspended' | 'banned'
  gender?: UserGender; // 'male' | 'female' | 'other'

  roles?: Role[]; // Optional array if user can have multiple roles

  email_verified?: boolean;

  [key: string]: unknown;
}

/**
 * Strongly-typed Supabase Auth user object
 */
export interface SupabaseUser {
  id: string;
  email?: string;
  phone?: string;
  app_metadata: SupabaseAppMetadata;
  user_metadata: SupabaseUserMetadata;

  aud: string;
  created_at: string;
  updated_at?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  last_sign_in_at?: string;
  role?: Role;
  aal?: string;
  amr?: { method: string; timestamp: number }[];
  session_id?: string;
  is_anonymous?: boolean;
}
