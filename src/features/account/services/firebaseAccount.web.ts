export type AccountAuthUser = {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  picture?: string;
  verifiedEmail: boolean;
};

export function configureAccountAuth(_config: {
  googleServicePlistPath?: string;
  iosClientId?: string;
  webClientId: string;
}) {
  return undefined;
}

export function observeAccountAuth(_listener: (user: AccountAuthUser | null) => void) {
  return () => undefined;
}

export async function signInWithGoogleAccount(): Promise<AccountAuthUser | null> {
  throw new Error('Use QR login on the web. Firebase Google Sign-In runs in the iOS/Android app.');
}

export async function signOutAccount() {
  return undefined;
}

export async function getAccountIdToken(_interactive = false) {
  return null;
}

export function accountAuthErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Google sign-in failed.';
}
