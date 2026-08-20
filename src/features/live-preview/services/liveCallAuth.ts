import { getAccountIdToken } from '../../account/services/firebaseAccount';
import { getGuestAuthHeaders } from '../../account/services/guest-session';

export async function getLiveCallAuthHeaders(): Promise<Record<string, string>> {
  const idToken = await getAccountIdToken(false);
  if (!idToken) {
    return getGuestAuthHeaders();
  }
  return { Authorization: `Bearer ${idToken}` };
}
