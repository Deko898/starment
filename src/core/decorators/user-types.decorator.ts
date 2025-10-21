import { SetMetadata } from '@nestjs/common';
import type { UserType } from '@starment/shared';

export const USER_TYPES_KEY = 'user_types';
export const UserTypes = (...types: UserType[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(USER_TYPES_KEY, types);
