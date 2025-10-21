import type { Role, UserType } from '../../enums';

/** Keep this auth-agnostic; it’s just the shape your app uses */
export interface RequestUser {
  id: string;
  jwt: string;
  role: Role;
  user_type: UserType;
  email?: string;
  display_name?: string;
}

export type UserResponse = Omit<RequestUser, 'jwt'>;
