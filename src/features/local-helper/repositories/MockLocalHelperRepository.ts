import { PayoutStatus, type LivePreviewRequest } from '../../live-preview/types';
import type { LivePreviewRepository } from '../../live-preview/repositories/LivePreviewRepository';
import type {
  LocalHelperEarning,
  LocalHelperOnlineInput,
  LocalHelperProfile,
  SaveLocalHelperProfileInput,
} from '../types';
import type { LocalHelperRepository } from './LocalHelperRepository';

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function cloneProfile(profile: LocalHelperProfile): LocalHelperProfile {
  return { ...profile, languages: [...profile.languages] };
}

function earningStatusFor(request: LivePreviewRequest): LocalHelperEarning['status'] {
  if (request.payoutStatus === PayoutStatus.Released) return 'released';
  if (request.payoutStatus === PayoutStatus.Disputed || request.payoutStatus === PayoutStatus.Blocked) {
    return 'disputed';
  }
  return 'pending';
}

export class MockLocalHelperRepository implements LocalHelperRepository {
  private readonly profilesByUserId = new Map<string, LocalHelperProfile>();

  constructor(private readonly livePreviewRepository: LivePreviewRepository) {}

  async getByUserId(userId: string): Promise<LocalHelperProfile | null> {
    const profile = this.profilesByUserId.get(userId);
    return profile ? cloneProfile(profile) : null;
  }

  async saveProfile(input: SaveLocalHelperProfileInput): Promise<LocalHelperProfile> {
    const existing = this.profilesByUserId.get(input.userId);
    const now = new Date().toISOString();
    const profile: LocalHelperProfile = {
      id: existing?.id ?? createId('helper'),
      userId: input.userId,
      fullName: input.fullName.trim(),
      avatarUrl: input.avatarUrl?.trim() ?? existing?.avatarUrl ?? '',
      phone: input.phone?.trim() ?? existing?.phone ?? '',
      email: input.email?.trim() ?? existing?.email ?? '',
      city: input.city,
      languages: input.languages.length > 0 ? input.languages : ['English'],
      intro: input.intro.trim(),
      currentLat: existing?.currentLat ?? null,
      currentLng: existing?.currentLng ?? null,
      isOnline: existing?.isOnline ?? false,
      isVerified: existing?.isVerified ?? false,
      rating: existing?.rating ?? 4.8,
      completedJobs: existing?.completedJobs ?? 0,
      payoutAccountStatus: input.payoutAccountLabel ? 'pending' : existing?.payoutAccountStatus ?? 'missing',
      payoutAccountLabel: input.payoutAccountLabel?.trim() ?? existing?.payoutAccountLabel ?? '',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    this.profilesByUserId.set(input.userId, profile);
    return cloneProfile(profile);
  }

  async setOnline(input: LocalHelperOnlineInput): Promise<LocalHelperProfile> {
    const existing = this.profilesByUserId.get(input.userId);
    if (!existing) {
      throw new Error('Create a local helper profile before going online');
    }

    const next: LocalHelperProfile = {
      ...existing,
      isOnline: input.isOnline,
      currentLat: input.currentLat ?? existing.currentLat,
      currentLng: input.currentLng ?? existing.currentLng,
      updatedAt: new Date().toISOString(),
    };
    this.profilesByUserId.set(input.userId, next);
    return cloneProfile(next);
  }

  async listEarnings(userId: string): Promise<LocalHelperEarning[]> {
    const requests = await this.livePreviewRepository.listForHelper(userId);
    return requests.map((request) => ({
      requestId: request.id,
      placeName: request.placeName,
      city: request.city,
      rewardCents: request.helperRewardCents,
      status: earningStatusFor(request),
      createdAt: request.createdAt,
      releasedAt: request.confirmedAt,
    }));
  }
}
