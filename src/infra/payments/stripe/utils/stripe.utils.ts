import Stripe from 'stripe';

import type { StripeClient } from './stripe.interface';
import type { OPTIONS_TYPE } from './stripe.module-definition';

export function createStripeClient({ apiKey, options }: typeof OPTIONS_TYPE): StripeClient {
  return new Stripe(apiKey, { ...options });
}
