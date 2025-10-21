import type { Request } from 'express';

import type { RequestUser } from './auth';

export interface RequestWithUser extends Request {
  user?: RequestUser;
}
