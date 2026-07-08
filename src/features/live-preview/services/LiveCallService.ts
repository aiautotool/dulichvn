import {
  LiveCallSessionStatus,
  type LiveCallProvider,
  type LiveCallSession,
  type LivePreviewRequest,
} from '../types';
import type { LiveCallRepository } from '../repositories/LiveCallRepository';

export type LiveCallRoomJoinResult = {
  roomId: string;
  provider: LiveCallProvider;
  usesMockMedia: boolean;
  signalingStatus: 'placeholder' | 'ready';
};

export interface LiveCallProviderAdapter {
  readonly provider: LiveCallProvider;
  createRoom(request: LivePreviewRequest): Promise<{ roomId: string }>;
  joinRoom(roomId: string): Promise<LiveCallRoomJoinResult>;
  leaveRoom(roomId: string): Promise<void>;
}

export class MockLiveCallProviderAdapter implements LiveCallProviderAdapter {
  readonly provider: LiveCallProvider = 'mock';

  async createRoom(request: LivePreviewRequest): Promise<{ roomId: string }> {
    return { roomId: request.callRoomId ?? `mock_room_${request.id}` };
  }

  async joinRoom(roomId: string): Promise<LiveCallRoomJoinResult> {
    return {
      roomId,
      provider: this.provider,
      usesMockMedia: true,
      signalingStatus: 'placeholder',
    };
  }

  async leaveRoom(): Promise<void> {
    return;
  }
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class LiveCallService {
  constructor(
    private readonly liveCallRepository: LiveCallRepository,
    private readonly providerAdapter: LiveCallProviderAdapter = new MockLiveCallProviderAdapter(),
  ) {}

  async join(request: LivePreviewRequest): Promise<LiveCallRoomJoinResult> {
    const room = await this.providerAdapter.createRoom(request);
    return this.providerAdapter.joinRoom(room.roomId);
  }

  async startSession(request: LivePreviewRequest): Promise<LiveCallSession> {
    const existing = await this.liveCallRepository.getByRequestId(request.id);
    if (existing) {
      return existing.status === LiveCallSessionStatus.Ended
        ? existing
        : this.liveCallRepository.updateSession(request.id, (session) => ({
            ...session,
            status: LiveCallSessionStatus.Active,
            startedAt: session.startedAt || new Date().toISOString(),
          }));
    }

    const room = await this.providerAdapter.createRoom(request);
    const now = new Date().toISOString();
    return this.liveCallRepository.createSession({
      id: createId('call'),
      requestId: request.id,
      roomId: room.roomId,
      provider: this.providerAdapter.provider,
      status: LiveCallSessionStatus.Active,
      startedAt: now,
      endedAt: null,
      durationSeconds: 0,
      recordingUrl: null,
      createdAt: now,
    });
  }

  async endSession(requestId: string, durationSeconds: number): Promise<LiveCallSession> {
    return this.liveCallRepository.updateSession(requestId, (session) => ({
      ...session,
      status: LiveCallSessionStatus.Ended,
      endedAt: new Date().toISOString(),
      durationSeconds: Math.max(0, Math.round(durationSeconds)),
    }));
  }
}
