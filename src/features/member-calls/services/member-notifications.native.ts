import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { MemberNotification } from './member-notifications';

const MEMBER_ALERTS_CHANNEL = 'member-alerts';
const MEMBER_CALLS_CHANNEL = 'member-calls-v2';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function initializeMemberNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(MEMBER_ALERTS_CHANNEL, {
      name: 'Tin nhắn thành viên',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 150, 250],
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync(MEMBER_CALLS_CHANNEL, {
      name: 'Cuộc gọi đến',
      description: 'Thông báo cuộc gọi thoại và video đến',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400, 200, 800],
      sound: 'default',
      audioAttributes: {
        usage: Notifications.AndroidAudioUsage.NOTIFICATION_RINGTONE,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION,
      },
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  await Notifications.setBadgeCountAsync(0);
  if (!permission.granted) return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return null;
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

export async function showMemberNotification(notification: MemberNotification) {
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.body,
      sound: 'default',
      badge: 1,
      data: notification,
      ...(notification.kind === 'call' ? { categoryIdentifier: 'member-call' } : {}),
    },
    trigger: Platform.OS === 'android'
      ? { channelId: notification.kind === 'call' ? MEMBER_CALLS_CHANNEL : MEMBER_ALERTS_CHANNEL }
      : null,
  });
}

export function listenForMemberNotificationPress(listener: (notification: MemberNotification) => void) {
  const handleResponse = (response: Notifications.NotificationResponse | null) => {
    if (!response) return;
    const data = response.notification.request.content.data as Partial<MemberNotification>;
    if (data.kind === 'call' || data.kind === 'chat' || data.kind === 'live-team') {
      void Notifications.setBadgeCountAsync(0);
      listener(data as MemberNotification);
    }
  };
  void Notifications.getLastNotificationResponseAsync().then((response) => {
    handleResponse(response);
    if (response) void Notifications.clearLastNotificationResponseAsync();
  });
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    handleResponse(response);
    void Notifications.clearLastNotificationResponseAsync();
  });
  return () => subscription.remove();
}
