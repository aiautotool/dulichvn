import {
  EscrowStatus,
  LivePreviewStatus,
  PayoutStatus,
  type LivePreviewRequest,
} from '../types';
import type { LivePreviewRepository } from '../repositories/LivePreviewRepository';
import type { PaymentEscrowRepository } from '../repositories/PaymentEscrowRepository';
import type { WalletService } from '../../wallet/services/WalletService';
import type { LivePreviewPurchase } from '../../payments/types';

function createProviderReference(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class PaymentEscrowService {
  constructor(
    private readonly livePreviewRepository: LivePreviewRepository,
    private readonly paymentEscrowRepository: PaymentEscrowRepository,
    private readonly walletService?: WalletService,
  ) {}

  async createPaymentIntent(request: LivePreviewRequest): Promise<LivePreviewRequest> {
    if (request.status !== LivePreviewStatus.PaymentPending) {
      throw new Error('Payment can only be created for a pending live preview request');
    }

    if (this.walletService) {
      await this.walletService.ensureCanPay(request.travelerId, request.priceCents);
    }

    const paymentIntentId = createProviderReference('wallet_pi');
    await this.paymentEscrowRepository.record({
      requestId: request.id,
      type: 'payment_intent_created',
      amountCents: request.priceCents,
      provider: 'wallet',
      providerReferenceId: paymentIntentId,
    });

    return this.livePreviewRepository.updateRequest(request.id, (current) => ({
      ...current,
      paymentIntentId,
      escrowStatus: EscrowStatus.Authorized,
    }));
  }

  async captureToEscrow(requestId: string): Promise<LivePreviewRequest> {
    const request = await this.requireRequest(requestId);
    if (request.status !== LivePreviewStatus.PaymentPending) {
      throw new Error('Only payment-pending requests can be captured to escrow');
    }
    if (!request.paymentIntentId) {
      throw new Error('Create a payment intent before capturing to escrow');
    }

    if (this.walletService) {
      await this.walletService.holdToEscrow(request.travelerId, request.priceCents, requestId);
    }

    await this.paymentEscrowRepository.record({
      requestId,
      type: 'captured_to_escrow',
      amountCents: request.priceCents,
      provider: 'wallet',
      providerReferenceId: request.paymentIntentId,
    });

    return this.livePreviewRepository.updateRequest(requestId, (current) => ({
      ...current,
      status: LivePreviewStatus.WaitingForHelper,
      escrowStatus: EscrowStatus.Escrowed,
      payoutStatus: PayoutStatus.Pending,
    }));
  }


  async captureGooglePlayPurchase(
    requestId: string,
    purchase: LivePreviewPurchase,
  ): Promise<LivePreviewRequest> {
    const request = await this.requireRequest(requestId);
    if (request.status !== LivePreviewStatus.PaymentPending) {
      throw new Error('Only payment-pending requests can be captured to escrow');
    }
    const paymentProvider = purchase.provider === 'google_play' || purchase.provider === 'demo' ? purchase.provider : null;
    if (!paymentProvider) {
      throw new Error('invalid_live_preview_purchase_provider');
    }
    if (purchase.productId !== 'live_preview_session_1') {
      throw new Error('invalid_live_preview_product_id');
    }
    if (purchase.amountCents < request.priceCents) {
      throw new Error('purchase_amount_too_low');
    }

    const providerReferenceId = `${purchase.provider}:${purchase.purchaseToken}`;
    await this.paymentEscrowRepository.record({
      requestId,
      type: 'payment_intent_created',
      amountCents: request.priceCents,
      provider: paymentProvider,
      providerReferenceId,
    });
    await this.paymentEscrowRepository.record({
      requestId,
      type: 'captured_to_escrow',
      amountCents: request.priceCents,
      provider: paymentProvider,
      providerReferenceId,
    });

    return this.livePreviewRepository.updateRequest(requestId, (current) => ({
      ...current,
      status: LivePreviewStatus.WaitingForHelper,
      paymentIntentId: providerReferenceId,
      escrowStatus: EscrowStatus.Escrowed,
      payoutStatus: PayoutStatus.Pending,
    }));
  }

  async releaseToHelper(requestId: string): Promise<LivePreviewRequest> {
    const request = await this.requireRequest(requestId);
    if (request.escrowStatus === EscrowStatus.Released || request.payoutStatus === PayoutStatus.Released) {
      throw new Error('Payment has already been released');
    }
    if (request.escrowStatus !== EscrowStatus.Escrowed) {
      throw new Error('Only escrowed payments can be released');
    }

    if (this.walletService) {
      const isGooglePlayPayment = request.paymentIntentId?.startsWith('google_play:') || request.paymentIntentId?.startsWith('demo:');
      if (!isGooglePlayPayment) {
        await this.walletService.releaseEscrow(request.travelerId, request.priceCents, requestId);
      }
      if (request.helperId) {
        await this.walletService.creditHelper(request.helperId, request.helperRewardCents, requestId);
      }
    }

    await this.paymentEscrowRepository.record({
      requestId,
      type: 'released_to_helper',
      amountCents: request.helperRewardCents,
      provider: 'wallet',
      providerReferenceId: request.paymentIntentId,
    });

    return this.livePreviewRepository.updateRequest(requestId, (current) => ({
      ...current,
      escrowStatus: EscrowStatus.Released,
      payoutStatus: PayoutStatus.Released,
    }));
  }

  async refundTraveler(requestId: string): Promise<LivePreviewRequest> {
    const request = await this.requireRequest(requestId);
    if (request.escrowStatus === EscrowStatus.Released) {
      throw new Error('Released payments cannot be refunded from escrow');
    }

    const isGooglePlayPayment = request.paymentIntentId?.startsWith('google_play:') || request.paymentIntentId?.startsWith('demo:');
    if (this.walletService && request.escrowStatus === EscrowStatus.Escrowed && !isGooglePlayPayment) {
      await this.walletService.refundEscrow(request.travelerId, request.priceCents, requestId);
    }

    await this.paymentEscrowRepository.record({
      requestId,
      type: 'refunded_to_traveler',
      amountCents: request.priceCents,
      provider: 'mock',
      providerReferenceId: request.paymentIntentId,
    });

    return this.livePreviewRepository.updateRequest(requestId, (current) => ({
      ...current,
      escrowStatus: EscrowStatus.Refunded,
      payoutStatus: PayoutStatus.None,
    }));
  }

  async markDisputed(requestId: string): Promise<LivePreviewRequest> {
    const request = await this.requireRequest(requestId);
    await this.paymentEscrowRepository.record({
      requestId,
      type: 'marked_disputed',
      amountCents: request.priceCents,
      provider: 'mock',
      providerReferenceId: request.paymentIntentId,
    });

    return this.livePreviewRepository.updateRequest(requestId, (current) => ({
      ...current,
      escrowStatus: EscrowStatus.Disputed,
      payoutStatus: PayoutStatus.Disputed,
    }));
  }

  private async requireRequest(requestId: string): Promise<LivePreviewRequest> {
    const request = await this.livePreviewRepository.getRequest(requestId);
    if (!request) {
      throw new Error('Live preview request not found');
    }
    return request;
  }
}
