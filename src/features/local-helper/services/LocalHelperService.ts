import type { LivePreviewService } from '../../live-preview/services/LivePreviewService';
import type { LivePreviewActor } from '../../live-preview/types';
import type { LocalHelperRepository } from '../repositories/LocalHelperRepository';
import type {
  LocalHelperEarning,
  LocalHelperJob,
  LocalHelperOnlineInput,
  LocalHelperProfile,
  SaveLocalHelperProfileInput,
} from '../types';

export class LocalHelperService {
  constructor(
    private readonly localHelperRepository: LocalHelperRepository,
    private readonly livePreviewService: LivePreviewService,
  ) {}

  async getProfile(userId: string): Promise<LocalHelperProfile | null> {
    return this.localHelperRepository.getByUserId(userId);
  }

  async saveProfile(input: SaveLocalHelperProfileInput): Promise<LocalHelperProfile> {
    if (!input.fullName.trim()) throw new Error('Full name is required');
    if (!input.city.trim()) throw new Error('Current city is required');
    if (!input.intro.trim()) throw new Error('Short intro is required');
    return this.localHelperRepository.saveProfile(input);
  }

  async setOnline(input: LocalHelperOnlineInput): Promise<LocalHelperProfile> {
    return this.localHelperRepository.setOnline(input);
  }

  async listNearbyJobs(userId: string): Promise<LocalHelperJob[]> {
    const profile = await this.localHelperRepository.getByUserId(userId);
    if (!profile || !profile.isOnline) return [];
    return this.livePreviewService.listNearbyJobs(profile);
  }

  async acceptJob(requestId: string, profile: LocalHelperProfile) {
    const actor: LivePreviewActor = {
      id: profile.userId,
      name: profile.fullName,
      role: 'helper',
    };
    return this.livePreviewService.acceptRequest(requestId, actor);
  }

  async listEarnings(userId: string): Promise<LocalHelperEarning[]> {
    return this.localHelperRepository.listEarnings(userId);
  }
}
