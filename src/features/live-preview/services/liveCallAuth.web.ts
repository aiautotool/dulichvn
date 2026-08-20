import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGuestAuthHeaders } from '../../account/services/guest-session';

const QR_WEB_SESSION_KEY = 'vinago-plus-web-qr-session';

export async function getLiveCallAuthHeaders(): Promise<Record<string, string>> {
  const sessionToken = await AsyncStorage.getItem(QR_WEB_SESSION_KEY);
  if (!sessionToken) {
    return getGuestAuthHeaders();
  }
  return { Authorization: `Bearer ${sessionToken}` };
}
