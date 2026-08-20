import type { MemberChatAttachment, MemberChatUpload } from './member-social-api';

export type MemberP2PTransfer = {
  isPeerOnline: () => boolean;
  send: (upload: MemberChatUpload) => Promise<MemberChatAttachment>;
  disconnect: () => Promise<void>;
};

export async function connectMemberP2PTransfer(_roomCode: string, _friendId: string, _onReceive: (attachment: MemberChatAttachment) => void | Promise<void>): Promise<MemberP2PTransfer> {
  throw new Error('Thiết bị này chưa hỗ trợ kênh chia sẻ trực tiếp.');
}
