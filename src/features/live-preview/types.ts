export enum LivePreviewStatus {
  Draft = 'draft',
  PaymentPending = 'payment_pending',
  Escrowed = 'escrowed',
  WaitingForHelper = 'waiting_for_helper',
  Accepted = 'accepted',
  InCall = 'in_call',
  CallEnded = 'call_ended',
  Completed = 'completed',
  Confirmed = 'confirmed',
  Disputed = 'disputed',
  Cancelled = 'cancelled',
  Expired = 'expired',
}

export enum EscrowStatus {
  None = 'none',
  Authorized = 'authorized',
  Captured = 'captured',
  Escrowed = 'escrowed',
  Released = 'released',
  Refunded = 'refunded',
  Disputed = 'disputed',
}

export enum PayoutStatus {
  None = 'none',
  Pending = 'pending',
  Releasable = 'releasable',
  Released = 'released',
  Blocked = 'blocked',
  Disputed = 'disputed',
}

export enum LiveCallSessionStatus {
  Created = 'created',
  Joining = 'joining',
  Active = 'active',
  Ended = 'ended',
  Failed = 'failed',
}

export type LiveCallProvider =
  | 'mock'
  | 'agora'
  | 'daily'
  | 'twilio-video'
  | 'livekit'
  | 'custom-webrtc';

export type LivePreviewActorRole = 'traveler' | 'helper' | 'admin';

export type LivePreviewActor = {
  id: string;
  name: string;
  role: LivePreviewActorRole;
};

export type LivePreviewRequest = {
  id: string;
  placeId: string;
  placeName: string;
  city: string;
  lat: number;
  lng: number;
  travelerId: string;
  travelerName: string;
  helperId: string | null;
  helperName: string | null;
  helperRating: number | null;
  helperDistanceKm: number | null;
  status: LivePreviewStatus;
  priceUsd: number;
  platformFeeUsd: number;
  helperRewardUsd: number;
  priceCents: number;
  platformFeeCents: number;
  helperRewardCents: number;
  requestedLanguage: string;
  note: string;
  createdAt: string;
  acceptedAt: string | null;
  callStartedAt: string | null;
  callEndedAt: string | null;
  confirmedAt: string | null;
  expiredAt: string | null;
  disputedAt: string | null;
  paymentIntentId: string | null;
  escrowStatus: EscrowStatus;
  payoutStatus: PayoutStatus;
  callRoomId: string | null;
};

export type CreateLivePreviewRequestInput = {
  placeId: string;
  placeName: string;
  city: string;
  lat: number;
  lng: number;
  travelerId: string;
  travelerName: string;
  requestedLanguage: string;
  note?: string;
};

export type LiveCallSession = {
  id: string;
  requestId: string;
  roomId: string;
  provider: LiveCallProvider;
  status: LiveCallSessionStatus;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  recordingUrl: string | null;
  createdAt: string;
};

export type LivePreviewRating = {
  id: string;
  requestId: string;
  travelerId: string;
  helperId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type LivePreviewJob = {
  request: LivePreviewRequest;
  distanceKm: number | null;
  expiresAt: string;
  isCityMatch: boolean;
};

export type LivePreviewAdminBucket = 'disputed' | 'expired' | 'completed';
