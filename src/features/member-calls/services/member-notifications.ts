export type MemberNotification = {
  kind: 'call' | 'chat' | 'live-team';
  title: string;
  body: string;
  friendId?: string;
  roomCode?: string;
};

export async function initializeMemberNotifications(): Promise<string | null> { return null; }
export async function showMemberNotification(_notification: MemberNotification) {}
export function listenForMemberNotificationPress(_listener: (notification: MemberNotification) => void) {
  return () => {};
}
