import type { MoneySplit } from '../../../lib/money';
import type { LocalHelperProfile } from '../../local-helper/types';
import type {
  CreateLivePreviewRequestInput,
  LivePreviewJob,
  LivePreviewRequest,
  LivePreviewStatus,
} from '../types';

export type LivePreviewJobFilters = {
  helperId: string;
  city?: string;
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number;
  language?: string;
};

export interface LivePreviewRepository {
  createRequest(
    input: CreateLivePreviewRequestInput,
    moneySplit: MoneySplit,
  ): Promise<LivePreviewRequest>;
  getRequest(id: string): Promise<LivePreviewRequest | null>;
  updateRequest(
    id: string,
    updater: (request: LivePreviewRequest) => LivePreviewRequest,
  ): Promise<LivePreviewRequest>;
  acceptRequest(id: string, helper: LocalHelperProfile, distanceKm: number | null): Promise<LivePreviewRequest>;
  listAvailableJobs(filters: LivePreviewJobFilters): Promise<LivePreviewJob[]>;
  listForHelper(helperId: string): Promise<LivePreviewRequest[]>;
  listByStatuses(statuses: LivePreviewStatus[]): Promise<LivePreviewRequest[]>;
}
