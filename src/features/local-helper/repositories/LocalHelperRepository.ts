import type {
  LocalHelperEarning,
  LocalHelperOnlineInput,
  LocalHelperProfile,
  SaveLocalHelperProfileInput,
} from '../types';

export interface LocalHelperRepository {
  getByUserId(userId: string): Promise<LocalHelperProfile | null>;
  saveProfile(input: SaveLocalHelperProfileInput): Promise<LocalHelperProfile>;
  setOnline(input: LocalHelperOnlineInput): Promise<LocalHelperProfile>;
  listEarnings(userId: string): Promise<LocalHelperEarning[]>;
}
