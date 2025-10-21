import type { Role, UserType } from '@starment/shared';

export const AUTH_PROVIDER = Symbol('AUTH_PROVIDER');

/**
 * Auth provider interface - database/provider agnostic
 * Can be implemented by Supabase, Firebase, Auth0, Clerk, etc.
 */
export interface IAuthProvider {
  /**
   * Register a new user with email/password
   */
  register(email: string, password: string): Promise<AuthResult>;

  /**
   * Register with additional metadata
   */
  registerWithMetadata(
    email: string,
    password: string,
    metadata: UserMetadata,
  ): Promise<AuthResult>;

  /**
   * Login with email/password
   */
  login(email: string, password: string): Promise<AuthResult>;

  /**
   * Refresh access token using refresh token
   */
  refresh(refreshToken: string): Promise<AuthResult>;

  /**
   * Logout user (invalidate session)
   */
  logout(jwt: string): Promise<void>;

  /**
   * Validate JWT token and return user info
   */
  validateToken(jwt: string): Promise<AuthUser>;
}

/**
 * Result returned from auth operations
 */
export interface AuthResult {
  user?: AuthUser;
  session?: AuthSession;
  requiresConfirmation: boolean;
  message?: string;
}

/**
 * Auth user - provider-agnostic user representation
 */
export interface AuthUser {
  id: string;
  email?: string;
  role: Role;
  userType: UserType;
  displayName?: string;
  metadata: Record<string, unknown>;
}

/**
 * Auth session - provider-agnostic session representation
 */
export interface AuthSession {
  userId: string;
  email?: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  role: Role;
  userType: UserType;
}

/**
 * User metadata for registration
 */
export interface UserMetadata {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  userType?: UserType;
  role?: Role;
  countryCode?: string;
  phone?: string;
  dateOfBirth?: string;
  [key: string]: unknown;
}
