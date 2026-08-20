import * as Sharing from 'expo-sharing';
import type { MemberChatAttachment } from './member-social-api';

export async function downloadMemberChatAttachment(attachment: MemberChatAttachment) {
  if (!await Sharing.isAvailableAsync()) throw new Error('Thiết bị không hỗ trợ lưu tài liệu.');
  await Sharing.shareAsync(attachment.url, { dialogTitle: `Lưu ${attachment.name}`, mimeType: attachment.mimeType });
}
