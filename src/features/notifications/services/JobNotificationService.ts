import type { LivePreviewRequest } from '../../live-preview/types';

export type JobNotificationAudience = 'all_app_users' | 'all_helpers' | 'nearby_helpers';

export type JobNotificationEvent = {
  id: string;
  audience: JobNotificationAudience;
  title: string;
  body: string;
  requestId: string;
  placeId: string;
  placeName: string;
  city: string;
  helperRewardCents: number;
  createdAt: string;
};

export interface JobNotificationService {
  notifyNewLivePreviewJob(request: LivePreviewRequest): Promise<JobNotificationEvent>;
  listEvents(): Promise<JobNotificationEvent[]>;
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class BroadcastJobNotificationService implements JobNotificationService {
  private readonly events: JobNotificationEvent[] = [];

  async notifyNewLivePreviewJob(request: LivePreviewRequest): Promise<JobNotificationEvent> {
    const event: JobNotificationEvent = {
      id: createId('job_push'),
      // Business requirement: notify every installed app/helper as fast as possible.
      // Production implementation should map this to an FCM topic such as vinago_live_jobs_all.
      audience: 'all_app_users',
      title: 'New live preview job',
      body: `${request.placeName} · earn $${(request.helperRewardCents / 100).toFixed(2)} · accept fast`,
      requestId: request.id,
      placeId: request.placeId,
      placeName: request.placeName,
      city: request.city,
      helperRewardCents: request.helperRewardCents,
      createdAt: new Date().toISOString(),
    };
    this.events.unshift(event);
    return { ...event };
  }

  async listEvents(): Promise<JobNotificationEvent[]> {
    return this.events.map((event) => ({ ...event }));
  }
}
