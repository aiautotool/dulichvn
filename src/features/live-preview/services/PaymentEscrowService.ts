import {
  EscrowStatus,
  LivePreviewStatus,
  PayoutStatus,
  type LivePreviewRequest,
} from '../types';
import type { LivePreviewRepository } from '../repositories/LivePreviewRepository';
import type { PaymentEscrowRepository } from '../repositories/PaymentEscrowRepository';

function createProviderReference(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class PaymentEscrowService {
  constructor(
    private readonly livePreviewRepository: LivePreviewRepository,
    private readonly paymentEscrowRepository: PaymentEscrowRepository,
  ) {}

  async createPaymentIntent(request: LivePreviewRequest): Promise<LivePreviewRequest> {
    if (request.status !== LivePreviewStatus.PaymentPending) {
      throw new Error('Payment can only be created for a pending live preview request');
    }

    const paymentIntentId = createProviderReference('mock_pi');
    await this.paymentEscrowRepository.record({
      requestId: request.id,
      type: 'payment_intent_created',
      amountCents: request.priceCents,
      provider: 'mock',
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

    await this.paymentEscrowRepository.record({
      requestId,
      type: 'captured_to_escrow',
      amountCents: request.priceCents,
      provider: 'mock',
      providerReferenceId: request.paymentIntentId,
    });

    return this.livePreviewRepository.updateRequest(requestId, (current) => ({
      ...current,
      status: LivePreviewStatus.WaitingForHelper,
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

    await this.paymentEscrowRepository.record({
      requestId,
      type: 'released_to_helper',
      amountCents: request.helperRewardCents,
      provider: 'mock',
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
