import type { LiveCallSession } from '../types';
import type { LiveCallRepository } from './LiveCallRepository';

export class MockLiveCallRepository implements LiveCallRepository {
  private readonly sessionsByRequestId = new Map<string, LiveCallSession>();

  async getByRequestId(requestId: string): Promise<LiveCallSession | null> {
    const session = this.sessionsByRequestId.get(requestId);
    return session ? { ...session } : null;
  }

  async createSession(session: LiveCallSession): Promise<LiveCallSession> {
    this.sessionsByRequestId.set(session.requestId, session);
    return { ...session };
  }

  async updateSession(
    requestId: string,
    updater: (session: LiveCallSession) => LiveCallSession,
  ): Promise<LiveCallSession> {
    const current = this.sessionsByRequestId.get(requestId);
    if (!current) {
      throw new Error('Live call session not found');
    }
    const next = updater({ ...current });
    this.sessionsByRequestId.set(requestId, next);
    return { ...next };
  }
}
