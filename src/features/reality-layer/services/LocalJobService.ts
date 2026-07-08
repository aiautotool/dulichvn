import type { LocalHelperJob, LocalHelperJobType } from '../types';

export type CreateLocalJobInput = {
  type: LocalHelperJobType;
  requesterId: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
  grossAmount: number;
};

export class LocalJobService {
  createJob(input: CreateLocalJobInput, now = Date.now()): LocalHelperJob {
    const platformFee = Math.round(input.grossAmount * 0.3 * 100) / 100;
    return {
      id: `job-${now}-${Math.random().toString(36).slice(2, 8)}`,
      type: input.type,
      requesterId: input.requesterId,
      placeId: input.placeId,
      latitude: input.latitude,
      longitude: input.longitude,
      grossAmount: input.grossAmount,
      helperAmount: Math.round((input.grossAmount - platformFee) * 100) / 100,
      platformFee,
      status: 'open',
      createdAt: now,
    };
  }

  acceptJob(job: LocalHelperJob, helperId: string): LocalHelperJob {
    if (job.status !== 'open' || job.helperId) throw new Error('job_not_available');
    if (job.requesterId === helperId) throw new Error('requester_cannot_accept_own_job');
    return { ...job, helperId, status: 'accepted' };
  }
}
