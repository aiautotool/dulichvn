import { getDistanceKm, roundDistanceKm } from '../../../lib/location/distance';
import type { MoneySplit } from '../../../lib/money';
import type { LocalHelperProfile } from '../../local-helper/types';
import {
  EscrowStatus,
  LivePreviewStatus,
  PayoutStatus,
  type CreateLivePreviewRequestInput,
  type LivePreviewJob,
  type LivePreviewRequest,
} from '../types';
import type { LivePreviewJobFilters, LivePreviewRepository } from './LivePreviewRepository';

const DEFAULT_JOB_RADIUS_KM = 3;
const DEFAULT_EXPIRY_MINUTES = 15;

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function cloneRequest(request: LivePreviewRequest): LivePreviewRequest {
  return { ...request };
}

function getExpiryTimestamp(createdAt: string): string {
  const expiresAt = new Date(createdAt);
  expiresAt.setMinutes(expiresAt.getMinutes() + DEFAULT_EXPIRY_MINUTES);
  return expiresAt.toISOString();
}

function languageMatches(jobLanguage: string, helperLanguage?: string): boolean {
  if (!helperLanguage || helperLanguage === 'Any') return true;
  return jobLanguage === 'Any' || jobLanguage.toLowerCase() === helperLanguage.toLowerCase();
}

export class MockLivePreviewRepository implements LivePreviewRepository {
  private readonly requests = new Map<string, LivePreviewRequest>();

  async createRequest(
    input: CreateLivePreviewRequestInput,
    moneySplit: MoneySplit,
  ): Promise<LivePreviewRequest> {
    const now = new Date().toISOString();
    const request: LivePreviewRequest = {
      id: createId('lp'),
      placeId: input.placeId,
      placeName: input.placeName,
      city: input.city,
      lat: input.lat,
      lng: input.lng,
      travelerId: input.travelerId,
      travelerName: input.travelerName,
      helperId: null,
      helperName: null,
      helperRating: null,
      helperDistanceKm: null,
      status: LivePreviewStatus.PaymentPending,
      priceUsd: moneySplit.priceUsd,
      platformFeeUsd: moneySplit.platformFeeUsd,
      helperRewardUsd: moneySplit.helperRewardUsd,
      priceCents: moneySplit.priceCents,
      platformFeeCents: moneySplit.platformFeeCents,
      helperRewardCents: moneySplit.helperRewardCents,
      requestedLanguage: input.requestedLanguage,
      note: input.note?.trim() ?? '',
      createdAt: now,
      acceptedAt: null,
      callStartedAt: null,
      callEndedAt: null,
      confirmedAt: null,
      expiredAt: null,
      disputedAt: null,
      paymentIntentId: null,
      escrowStatus: EscrowStatus.None,
      payoutStatus: PayoutStatus.None,
      callRoomId: null,
    };

    this.requests.set(request.id, request);
    return cloneRequest(request);
  }

  async getRequest(id: string): Promise<LivePreviewRequest | null> {
    const request = this.requests.get(id);
    return request ? cloneRequest(request) : null;
  }

  async updateRequest(
    id: string,
    updater: (request: LivePreviewRequest) => LivePreviewRequest,
  ): Promise<LivePreviewRequest> {
    const current = this.requests.get(id);
    if (!current) {
      throw new Error('Live preview request not found');
    }

    const next = updater(cloneRequest(current));
    this.requests.set(id, next);
    return cloneRequest(next);
  }

  async acceptRequest(
    id: string,
    helper: LocalHelperProfile,
    distanceKm: number | null,
  ): Promise<LivePreviewRequest> {
    return this.updateRequest(id, (request) => {
      if (request.status !== LivePreviewStatus.WaitingForHelper || request.helperId) {
        throw new Error('This live preview request is no longer available');
      }

      const now = new Date().toISOString();
      return {
        ...request,
        helperId: helper.userId,
        helperName: helper.fullName,
        helperRating: helper.rating,
        helperDistanceKm: distanceKm,
        acceptedAt: now,
        status: LivePreviewStatus.Accepted,
        payoutStatus: PayoutStatus.Pending,
        callRoomId: createId('room'),
      };
    });
  }

  async listAvailableJobs(filters: LivePreviewJobFilters): Promise<LivePreviewJob[]> {
    const radiusKm = filters.radiusKm ?? DEFAULT_JOB_RADIUS_KM;
    const helperCoords =
      typeof filters.lat === 'number' && typeof filters.lng === 'number'
        ? { lat: filters.lat, lng: filters.lng }
        : null;

    return Array.from(this.requests.values())
      .filter((request) => request.status === LivePreviewStatus.WaitingForHelper)
      .filter((request) => request.travelerId !== filters.helperId)
      .map((request) => {
        const placeCoords = { lat: request.lat, lng: request.lng };
        const rawDistance = helperCoords ? getDistanceKm(helperCoords, placeCoords) : null;
        const distanceKm = rawDistance === null ? null : roundDistanceKm(rawDistance);
        const cityMatch = filters.city ? request.city === filters.city : false;
        return {
          request,
          distanceKm,
          expiresAt: getExpiryTimestamp(request.createdAt),
          isCityMatch: cityMatch,
        };
      })
      .filter((job) => {
        if (!languageMatches(job.request.requestedLanguage, filters.language)) return false;
        if (job.distanceKm !== null) return job.distanceKm <= radiusKm;
        return job.isCityMatch;
      })
      .sort((a, b) => {
        const aDistance = a.distanceKm ?? Number.MAX_SAFE_INTEGER;
        const bDistance = b.distanceKm ?? Number.MAX_SAFE_INTEGER;
        return aDistance - bDistance;
      })
      .map((job) => ({ ...job, request: cloneRequest(job.request) }));
  }

  async listForHelper(helperId: string): Promise<LivePreviewRequest[]> {
    return Array.from(this.requests.values())
      .filter((request) => request.helperId === helperId)
      .map(cloneRequest);
  }

  async listByStatuses(statuses: LivePreviewStatus[]): Promise<LivePreviewRequest[]> {
    const statusSet = new Set(statuses);
    return Array.from(this.requests.values())
      .filter((request) => statusSet.has(request.status))
      .map(cloneRequest);
  }
}
