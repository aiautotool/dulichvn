import type { LiveCallSession } from '../types';

export interface LiveCallRepository {
  getByRequestId(requestId: string): Promise<LiveCallSession | null>;
  createSession(session: LiveCallSession): Promise<LiveCallSession>;
  updateSession(
    requestId: string,
    updater: (session: LiveCallSession) => LiveCallSession,
  ): Promise<LiveCallSession>;
}
