/**
 * Configuration options for the Payments module
 */
export interface PaymentsModuleOptions {
  /** Payment provider to use */
  provider: PaymentProviderType;
  /** Provider-specific configuration options */
  extra: PaymentExtraOptions;
}

/**
 * Supported payment provider types
 */
export type PaymentProviderType = 'stripe' | 'mangopay';

/**
 * Common configuration options for payment providers
 */
export interface PaymentExtraOptions {
  /** API key for the payment provider */
  apiKey: string;
  /** Optional webhook secret for verifying webhook signatures */
  webhookSecret?: string;
  /** Optional API version */
  apiVersion?: string;
  /** Optional environment (test/production) */
  environment?: 'test' | 'production';
}

/**
 * Stripe-specific configuration options
 */
export interface StripeExtraOptions extends PaymentExtraOptions {
  /** Stripe-specific options */
  publishableKey?: string;
}

/**
 * MangoPay-specific configuration options
 */
export interface MangoPayExtraOptions extends PaymentExtraOptions {
  /** Client ID for MangoPay */
  clientId?: string;
}
