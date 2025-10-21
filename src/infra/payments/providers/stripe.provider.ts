import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Stripe } from 'stripe';

import {
  AccountCreateParams,
  AccountResponse,
  AccountStatusResponse,
  PaymentCaptureParams,
  PaymentCaptureResponse,
  PaymentInitParams,
  PaymentInitResponse,
  PaymentProvider,
  PaymentRefundParams,
  PaymentRefundResponse,
  PaymentStatus,
  PaymentStatusResponse,
  PayoutParams,
  PayoutResponse,
} from '../interfaces';
import { StripeService } from '../stripe';

@Injectable()
export class StripePaymentProvider implements PaymentProvider {
  constructor(
    private readonly stripeService: StripeService,
    private readonly logger: PinoLogger,
  ) {}

  // Shorthand accessor to avoid repeating long chains
  private get stripe(): Stripe {
    return this.stripeService.stripeSdk;
  }

  /* -------------------------------------------------------------------------- */
  /*                               Payment Methods                              */
  /* -------------------------------------------------------------------------- */

  async initializePayment(data: PaymentInitParams): Promise<PaymentInitResponse> {
    // We’ll use Payment Intents (safe for both card & wallet payments)
    const intent = await this.stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency.toLowerCase(),
      description: data.description ?? 'Starment Payment',
      capture_method: data.autoCapture ? 'automatic' : 'manual',
      metadata: data.metadata,
    });

    return {
      id: intent.id,
      clientSecret: intent.client_secret ?? undefined,
      status: this.mapStatus(intent.status),
    };
  }

  async capturePayment(data: PaymentCaptureParams): Promise<PaymentCaptureResponse> {
    const intent = await this.stripe.paymentIntents.capture(data.paymentId, {
      amount_to_capture: data.amount,
    });

    return {
      id: intent.id,
      status: this.mapStatus(intent.status),
    };
  }

  async refundPayment(data: PaymentRefundParams): Promise<PaymentRefundResponse> {
    const refund = await this.stripe.refunds.create({
      payment_intent: data.paymentId,
      amount: data.amount,
      reason: data.reason as Stripe.RefundCreateParams.Reason,
    });

    return {
      id: refund.id,
      status: refund.status as 'pending' | 'succeeded' | 'failed',
      amount: refund.amount,
      createdAt: new Date(refund.created * 1000).toISOString(),
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    const intent = await this.stripe.paymentIntents.retrieve(paymentId, {
      expand: ['latest_charge'],
    });

    // Stripe returns either a charge object or an ID string
    const charge = typeof intent.latest_charge === 'object' ? intent.latest_charge : undefined;

    return {
      id: intent.id,
      status: this.mapStatus(intent.status),
      amount: intent.amount,
      currency: intent.currency.toUpperCase(),
      createdAt: new Date(intent.created * 1000).toISOString(),
      updatedAt: charge?.created ? new Date(charge.created * 1000).toISOString() : undefined,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                            Connected Accounts (KYC)                        */
  /* -------------------------------------------------------------------------- */

  async createConnectedAccount(data: AccountCreateParams): Promise<AccountResponse> {
    this.logger.debug(`Creating Stripe connected account for creator ${data.creatorId}`);

    const account = await this.stripe.accounts.create({
      type: 'express',
      country: data.country,
      email: data.email,
      business_type: data.type ?? 'individual',
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
    });

    // Create onboarding link (for redirect flow)
    const accountLink = await this.stripe.accountLinks.create({
      account: account.id,
      refresh_url: data.refreshUrl ?? 'https://example.com/reauth',
      return_url: data.returnUrl ?? 'https://example.com/complete',
      type: 'account_onboarding',
    });

    return {
      id: account.id,
      status: account.details_submitted ? 'verified' : 'pending',
      onboardingUrl: accountLink.url,
      detailsSubmitted: account.details_submitted,
    };
  }

  async getAccountStatus(accountId: string): Promise<AccountStatusResponse> {
    const account = await this.stripe.accounts.retrieve(accountId);

    return {
      id: account.id,
      status: account.details_submitted ? 'verified' : 'pending',
      payoutsEnabled: account.payouts_enabled,
      chargesEnabled: account.charges_enabled,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Payouts                                  */
  /* -------------------------------------------------------------------------- */

  async payout(data: PayoutParams): Promise<PayoutResponse> {
    const payout = await this.stripe.payouts.create(
      {
        amount: data.amount,
        currency: data.currency.toLowerCase(),
        description: data.description,
      },
      { stripeAccount: data.accountId }, // on behalf of connected account
    );

    return {
      id: payout.id,
      status: payout.status as 'pending' | 'paid' | 'failed' | 'canceled',
      arrivalDate: new Date(payout.arrival_date * 1000).toISOString(),
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                              Helper Conversions                            */
  /* -------------------------------------------------------------------------- */

  private mapStatus(stripeStatus: string): PaymentStatus {
    switch (stripeStatus) {
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'processing':
        return 'pending';

      case 'requires_action':
      case 'requires_capture':
        return 'requires_action';

      case 'succeeded':
        return 'succeeded';

      case 'canceled':
        return 'failed';

      default:
        return 'failed';
    }
  }
}
