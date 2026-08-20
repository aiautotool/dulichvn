import type { MemberChatAttachment } from './member-social-api';

export async function downloadMemberChatAttachment(attachment: MemberChatAttachment) {
  const blob = await fetch(attachment.url).then((response) => response.blob());
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = attachment.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
