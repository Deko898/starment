/**
 * Base abstraction for any payment provider integration (Stripe, Mangopay, etc.)
 * All methods are normalized to be provider-agnostic.
 */

export interface PaymentProvider {
  /** Initialize a payment intent or checkout session */
  initializePayment: (data: PaymentInitParams) => Promise<PaymentInitResponse>;

  /** Capture an authorized payment (if not auto-captured) */
  capturePayment: (data: PaymentCaptureParams) => Promise<PaymentCaptureResponse>;

  /** Refund a completed payment */
  refundPayment: (data: PaymentRefundParams) => Promise<PaymentRefundResponse>;

  /** Get current status of a payment (pending, succeeded, failed, refunded, etc.) */
  getPaymentStatus: (paymentId: string) => Promise<PaymentStatusResponse>;

  /** Create connected (sub-merchant) account — for creators or vendors */
  createConnectedAccount?: (data: AccountCreateParams) => Promise<AccountResponse>;

  /** Retrieve connected account verification / KYC status */
  getAccountStatus?: (accountId: string) => Promise<AccountStatusResponse>;

  /** Payout funds to a connected account’s bank */
  payout?: (data: PayoutParams) => Promise<PayoutResponse>;
}

/* -------------------------------------------------------------------------- */
/*                                  Payments                                  */
/* -------------------------------------------------------------------------- */

/** Payment initialization request */
export interface PaymentInitParams {
  /** Unique ID of user (fan) initiating the payment */
  customerId: string;
  /** Unique ID of creator (optional if platform-only) */
  creatorId?: string;
  /** Amount in smallest currency unit (e.g. cents) */
  amount: number;
  /** ISO 4217 currency code (e.g. "USD", "EUR", "MKD") */
  currency: string;
  /** Payment description for receipts */
  description?: string;
  /** Whether the payment should be captured immediately */
  autoCapture?: boolean;
  /** Metadata for platform tracking (e.g. orderId, sessionId) */
  metadata?: Record<string, string>;
  /** Return or success/cancel URLs for hosted sessions */
  redirectUrls?: {
    successUrl: string;
    cancelUrl: string;
  };
}

export interface PaymentInitResponse {
  /** Provider payment/session ID */
  id: string;
  /** Redirect URL for checkout (if applicable) */
  checkoutUrl?: string;
  /** Client secret (for client-side SDKs like Stripe Elements) */
  clientSecret?: string;
  /** Unified status string */
  status: PaymentStatus;
}

/** Capture request for an existing authorization */
export interface PaymentCaptureParams {
  paymentId: string;
  amount?: number;
}

export interface PaymentCaptureResponse {
  id: string;
  status: PaymentStatus;
}

/** Refund request */
export interface PaymentRefundParams {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface PaymentRefundResponse {
  id: string;
  status: 'pending' | 'succeeded' | 'failed';
  amount: number;
  createdAt: string;
}

/** Status check response */
export interface PaymentStatusResponse {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt?: string;
}

export type PaymentStatus =
  | 'pending' // payment in progress
  | 'requires_action' // awaiting user or system action (3DS, capture, etc.)
  | 'succeeded' // completed successfully
  | 'failed' // permanently failed or canceled
  | 'refunded'; // refunded after success

/* -------------------------------------------------------------------------- */
/*                             Connected Accounts                             */
/* -------------------------------------------------------------------------- */

/** Create connected account (for creators/vendors) */
export interface AccountCreateParams {
  /** Creator’s user ID in your system */
  creatorId: string;
  /** Country of residence (ISO 3166-1 alpha-2) */
  country: string;
  /** Email for Stripe onboarding / KYC contact */
  email: string;
  /** Whether it’s individual or company account */
  type?: 'individual' | 'company';
  /** Optional redirect URLs for onboarding */
  returnUrl?: string;
  refreshUrl?: string;
}

export interface AccountResponse {
  id: string;
  status: 'pending' | 'verified' | 'restricted';
  onboardingUrl?: string;
  detailsSubmitted?: boolean;
}

/** Get connected account status */
export interface AccountStatusResponse {
  id: string;
  status: 'pending' | 'verified' | 'restricted';
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                   Payouts                                  */
/* -------------------------------------------------------------------------- */

export interface PayoutParams {
  /** Connected account ID to send funds to */
  accountId: string;
  /** Amount in smallest currency unit */
  amount: number;
  /** Currency code */
  currency: string;
  /** Optional description shown in payout record */
  description?: string;
}

export interface PayoutResponse {
  id: string;
  status: 'pending' | 'paid' | 'failed' | 'canceled';
  arrivalDate?: string;
}
