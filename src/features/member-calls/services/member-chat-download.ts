import { Linking } from 'react-native';
import type { MemberChatAttachment } from './member-social-api';

export async function downloadMemberChatAttachment(attachment: MemberChatAttachment) {
  await Linking.openURL(attachment.url);
}
