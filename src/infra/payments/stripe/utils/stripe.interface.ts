import type Stripe from 'stripe';

export type StripeClient = Stripe;

export interface StripeModuleOptions {
  apiKey: string;
  options?: Stripe.StripeConfig;
}
