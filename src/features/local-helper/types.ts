import type { LivePreviewJob } from '../live-preview/types';

export type PayoutAccountStatus = 'missing' | 'pending' | 'ready' | 'blocked';

export type LocalHelperProfile = {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl: string;
  phone: string;
  email: string;
  city: string;
  languages: string[];
  intro: string;
  currentLat: number | null;
  currentLng: number | null;
  isOnline: boolean;
  isVerified: boolean;
  rating: number;
  completedJobs: number;
  payoutAccountStatus: PayoutAccountStatus;
  payoutAccountLabel: string;
  createdAt: string;
  updatedAt: string;
};

export type SaveLocalHelperProfileInput = {
  userId: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
  city: string;
  languages: string[];
  intro: string;
  payoutAccountLabel?: string;
};

export type LocalHelperOnlineInput = {
  userId: string;
  isOnline: boolean;
  currentLat?: number | null;
  currentLng?: number | null;
};

export type LocalHelperEarning = {
  requestId: string;
  placeName: string;
  city: string;
  rewardCents: number;
  status: 'pending' | 'released' | 'disputed';
  createdAt: string;
  releasedAt: string | null;
};

export type LocalHelperJob = LivePreviewJob;
