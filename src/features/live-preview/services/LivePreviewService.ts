import { getDistanceKm, roundDistanceKm } from '../../../lib/location/distance';
import { createLivePreviewMoneySplit } from '../../../lib/money';
import type { LocalHelperRepository } from '../../local-helper/repositories/LocalHelperRepository';
import type { LocalHelperProfile } from '../../local-helper/types';
import type { LivePreviewRepository } from '../repositories/LivePreviewRepository';
import {
  EscrowStatus,
  LivePreviewStatus,
  PayoutStatus,
  type CreateLivePreviewRequestInput,
  type LivePreviewActor,
  type LivePreviewJob,
  type LivePreviewRequest,
} from '../types';
import { LiveCallService } from './LiveCallService';
import { PaymentEscrowService } from './PaymentEscrowService';
import type { JobNotificationService } from '../../notifications/services/JobNotificationService';
import type { LivePreviewPurchase } from '../../payments/types';

const DEFAULT_HELPER_RADIUS_KM = 3;

export class LivePreviewService {
  constructor(
    private readonly livePreviewRepository: LivePreviewRepository,
    private readonly localHelperRepository: LocalHelperRepository,
    private readonly paymentEscrowService: PaymentEscrowService,
    private readonly liveCallService: LiveCallService,
    private readonly jobNotificationService?: JobNotificationService,
  ) {}

  async createRequest(input: CreateLivePreviewRequestInput): Promise<LivePreviewRequest> {
    return this.livePreviewRepository.createRequest(input, createLivePreviewMoneySplit());
  }

  async payAndPublish(requestId: string, traveler: LivePreviewActor): Promise<LivePreviewRequest> {
    const request = await this.requireRequest(requestId);
    this.assertTravelerOwner(request, traveler);
    const withIntent = await this.paymentEscrowService.createPaymentIntent(request);
    const published = await this.paymentEscrowService.captureToEscrow(withIntent.id);
    await this.jobNotificationService?.notifyNewLivePreviewJob(published);
    return published;
  }

  async createPaidRequest(
    input: CreateLivePreviewRequestInput,
    traveler: LivePreviewActor,
  ): Promise<LivePreviewRequest> {
    const request = await this.createRequest(input);
    return this.payAndPublish(request.id, traveler);
  }


  async createGooglePlayPaidRequest(
    input: CreateLivePreviewRequestInput,
    traveler: LivePreviewActor,
    purchase: LivePreviewPurchase,
  ): Promise<LivePreviewRequest> {
    const request = await this.createRequest(input);
    this.assertTravelerOwner(request, traveler);
    const published = await this.paymentEscrowService.captureGooglePlayPurchase(request.id, purchase);
    await this.jobNotificationService?.notifyNewLivePreviewJob(published);
    return published;
  }

  async getRequest(requestId: string): Promise<LivePreviewRequest | null> {
    return this.livePreviewRepository.getRequest(requestId);
  }

  async listNearbyJobs(helper: LocalHelperProfile, radiusKm = DEFAULT_HELPER_RADIUS_KM): Promise<LivePreviewJob[]> {
    return this.livePreviewRepository.listAvailableJobs({
      helperId: helper.userId,
      city: helper.city,
      lat: helper.currentLat,
      lng: helper.currentLng,
      radiusKm,
      language: helper.languages[0],
    });
  }

  async acceptRequest(requestId: string, helper: LivePreviewActor): Promise<LivePreviewRequest> {
    const request = await this.requireRequest(requestId);
    if (request.status !== LivePreviewStatus.WaitingForHelper || request.escrowStatus !== EscrowStatus.Escrowed) {
      throw new Error('Helper cannot accept an unpaid or unavailable request');
    }
    if (request.travelerId === helper.id) {
      throw new Error('Helper cannot accept their own live preview request');
    }

    const helperProfile = await this.requireHelperProfile(helper.id);
    const distanceKm = this.getHelperDistanceKm(helperProfile, request);
    return this.livePreviewRepository.acceptRequest(requestId, helperProfile, distanceKm);
  }

  async startCall(requestId: string, actor: LivePreviewActor): Promise<LivePreviewRequest> {
    const request = await this.requireRequest(requestId);
    this.assertCallParticipant(request, actor);
    if (request.status !== LivePreviewStatus.Accepted && request.status !== LivePreviewStatus.InCall) {
      throw new Error('Live call can only start after a helper accepts the request');
    }

    await this.liveCallService.startSession(request);
    return this.livePreviewRepository.updateRequest(requestId, (current) => ({
      ...current,
      status: LivePreviewStatus.InCall,
      callStartedAt: current.callStartedAt ?? new Date().toISOString(),
    }));
  }

  async endCall(
    requestId: string,
    actor: LivePreviewActor,
    durationSeconds: number,
  ): Promise<LivePreviewRequest> {
    const request = await this.requireRequest(requestId);
    this.assertCallParticipant(request, actor);
    if (request.status !== LivePreviewStatus.InCall || !request.callStartedAt) {
      throw new Error('Only an active live call can be ended');
    }

    await this.liveCallService.endSession(requestId, durationSeconds);
    return this.livePreviewRepository.updateRequest(requestId, (current) => ({
      ...current,
      status: LivePreviewStatus.Completed,
      payoutStatus: PayoutStatus.Releasable,
      callEndedAt: new Date().toISOString(),
    }));
  }

  async confirmCompletion(
    requestId: string,
    traveler: LivePreviewActor,
  ): Promise<LivePreviewRequest> {
    const request = await this.requireRequest(requestId);
    this.assertTravelerOwner(request, traveler);
    if (![LivePreviewStatus.Completed, LivePreviewStatus.CallEnded].includes(request.status)) {
      throw new Error('Traveler can confirm only after the call has ended');
    }
    if (!request.callStartedAt || !request.callEndedAt) {
      throw new Error('Request cannot be confirmed if the call never started and ended');
    }
    if (request.escrowStatus === EscrowStatus.Released || request.payoutStatus === PayoutStatus.Released) {
      throw new Error('Payment cannot be released twice');
    }

    await this.paymentEscrowService.releaseToHelper(requestId);
    return this.livePreviewRepository.updateRequest(requestId, (current) => ({
      ...current,
      status: LivePreviewStatus.Confirmed,
      confirmedAt: new Date().toISOString(),
      escrowStatus: EscrowStatus.Released,
      payoutStatus: PayoutStatus.Released,
    }));
  }

  async disputeRequest(requestId: string, traveler: LivePreviewActor): Promise<LivePreviewRequest> {
    const request = await this.requireRequest(requestId);
    this.assertTravelerOwner(request, traveler);
    if (request.status === LivePreviewStatus.Confirmed || request.escrowStatus === EscrowStatus.Released) {
      throw new Error('Confirmed requests cannot be disputed from the app');
    }

    await this.paymentEscrowService.markDisputed(requestId);
    return this.livePreviewRepository.updateRequest(requestId, (current) => ({
      ...current,
      status: LivePreviewStatus.Disputed,
      disputedAt: new Date().toISOString(),
      escrowStatus: EscrowStatus.Disputed,
      payoutStatus: PayoutStatus.Disputed,
    }));
  }

  async cancelRequest(requestId: string, traveler: LivePreviewActor): Promise<LivePreviewRequest> {
    const request = await this.requireRequest(requestId);
    this.assertTravelerOwner(request, traveler);
    if (
      [
        LivePreviewStatus.Accepted,
        LivePreviewStatus.InCall,
        LivePreviewStatus.Completed,
        LivePreviewStatus.Confirmed,
      ].includes(request.status)
    ) {
      throw new Error('Accepted or completed requests cannot be cancelled');
    }

    if (request.escrowStatus === EscrowStatus.Escrowed || request.escrowStatus === EscrowStatus.Authorized) {
      await this.paymentEscrowService.refundTraveler(requestId);
    }

    return this.livePreviewRepository.updateRequest(requestId, (current) => ({
      ...current,
      status: LivePreviewStatus.Cancelled,
      escrowStatus:
        current.escrowStatus === EscrowStatus.Escrowed || current.escrowStatus === EscrowStatus.Authorized
          ? EscrowStatus.Refunded
          : current.escrowStatus,
      payoutStatus: PayoutStatus.None,
    }));
  }

  async expireRequest(requestId: string): Promise<LivePreviewRequest> {
    const request = await this.requireRequest(requestId);
    if (request.helperId || [LivePreviewStatus.Accepted, LivePreviewStatus.InCall].includes(request.status)) {
      throw new Error('Accepted requests cannot expire automatically');
    }

    if (request.escrowStatus === EscrowStatus.Escrowed || request.escrowStatus === EscrowStatus.Authorized) {
      await this.paymentEscrowService.refundTraveler(requestId);
    }

    return this.livePreviewRepository.updateRequest(requestId, (current) => ({
      ...current,
      status: LivePreviewStatus.Expired,
      expiredAt: new Date().toISOString(),
      escrowStatus:
        current.escrowStatus === EscrowStatus.Escrowed || current.escrowStatus === EscrowStatus.Authorized
          ? EscrowStatus.Refunded
          : current.escrowStatus,
      payoutStatus: PayoutStatus.None,
    }));
  }

  async listAdminBucket(bucket: 'disputed' | 'expired' | 'completed'): Promise<LivePreviewRequest[]> {
    if (bucket === 'disputed') return this.livePreviewRepository.listByStatuses([LivePreviewStatus.Disputed]);
    if (bucket === 'expired') return this.livePreviewRepository.listByStatuses([LivePreviewStatus.Expired]);
    return this.livePreviewRepository.listByStatuses([
      LivePreviewStatus.Completed,
      LivePreviewStatus.Confirmed,
      LivePreviewStatus.CallEnded,
    ]);
  }

  private async requireRequest(requestId: string): Promise<LivePreviewRequest> {
    const request = await this.livePreviewRepository.getRequest(requestId);
    if (!request) {
      throw new Error('Live preview request not found');
    }
    return request;
  }

  private async requireHelperProfile(userId: string): Promise<LocalHelperProfile> {
    const profile = await this.localHelperRepository.getByUserId(userId);
    if (!profile) {
      throw new Error('Helper profile is required before accepting live preview jobs');
    }
    return profile;
  }

  private assertTravelerOwner(request: LivePreviewRequest, actor: LivePreviewActor) {
    if (actor.role !== 'traveler' || request.travelerId !== actor.id) {
      throw new Error('Traveler can manage only their own live preview request');
    }
  }

  private assertCallParticipant(request: LivePreviewRequest, actor: LivePreviewActor) {
    if (actor.role === 'traveler' && request.travelerId === actor.id) return;
    if (actor.role === 'helper' && request.helperId === actor.id) return;
    throw new Error('Only the traveler or accepted helper can join this live call');
  }

  private getHelperDistanceKm(
    helperProfile: LocalHelperProfile,
    request: LivePreviewRequest,
  ): number | null {
    if (helperProfile.currentLat === null || helperProfile.currentLng === null) {
      return null;
    }
    return roundDistanceKm(
      getDistanceKm(
        { lat: helperProfile.currentLat, lng: helperProfile.currentLng },
        { lat: request.lat, lng: request.lng },
      ),
    );
  }
}
