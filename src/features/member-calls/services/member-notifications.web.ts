import type { MemberNotification } from './member-notifications';

let pressListener: ((notification: MemberNotification) => void) | null = null;

export async function initializeMemberNotifications() {
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') await Notification.requestPermission();
  return null;
}

export async function showMemberNotification(notification: MemberNotification) {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    const alert = new Notification(notification.title, { body: notification.body, data: notification });
    alert.onclick = () => { window.focus(); alert.close(); pressListener?.(notification); };
  }
}

export function listenForMemberNotificationPress(listener: (notification: MemberNotification) => void) {
  pressListener = listener;
  return () => { if (pressListener === listener) pressListener = null; };
}
