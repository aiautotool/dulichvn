import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import {
  GoogleSignin,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

export type AccountAuthUser = {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  picture?: string;
  verifiedEmail: boolean;
};

const FIREBASE_NOT_CONFIGURED_MESSAGE =
  'Firebase Auth is not configured. On iOS, add the correct GoogleService-Info.plist for com.vinago.plus and rebuild the native app.';

let configured = false;

export function configureAccountAuth({
  googleServicePlistPath,
  iosClientId,
  webClientId,
}: {
  googleServicePlistPath?: string;
  iosClientId?: string;
  webClientId: string;
}) {
  if (configured) return;

  const iosClientConfig =
    Platform.OS === 'ios'
      ? iosClientId
        ? { iosClientId }
        : { googleServicePlistPath: googleServicePlistPath ?? 'GoogleService-Info' }
      : {};

  GoogleSignin.configure({
    webClientId,
    ...iosClientConfig,
  });
  configured = true;
}

export function observeAccountAuth(listener: (user: AccountAuthUser | null) => void) {
  let auth: ReturnType<typeof getAuth>;
  try {
    auth = getAuth();
  } catch {
    listener(null);
    return () => undefined;
  }

  let revision = 0;
  return onAuthStateChanged(auth, (firebaseUser) => {
    const currentRevision = ++revision;
    if (!firebaseUser) {
      listener(null);
      return;
    }

    const accountUser = accountUserFromFirebaseUser(firebaseUser);
    if (currentRevision === revision) {
      listener(accountUser);
    }
  });
}

export async function signInWithGoogleAccount() {
  const firebaseUser = await signInGoogleFirebaseSession();
  return firebaseUser ? accountUserFromFirebaseUser(firebaseUser) : null;
}

export async function signOutAccount() {
  await Promise.allSettled([GoogleSignin.signOut(), firebaseSignOut(getConfiguredAuth())]);
}

export async function getAccountIdToken(interactive = false) {
  try {
    const firebaseUser = await ensureFirebaseUser(interactive);
    return firebaseUser ? firebaseUser.getIdToken() : null;
  } catch (error) {
    if (interactive) throw error;
    return null;
  }
}

async function ensureFirebaseUser(interactive: boolean): Promise<FirebaseAuthTypes.User | null> {
  const auth = getConfiguredAuth();
  if (auth.currentUser) return auth.currentUser;

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: interactive });
  } catch (error) {
    if (interactive) throw error;
    return null;
  }

  try {
    if (GoogleSignin.getCurrentUser()) {
      return signInFirebaseWithCurrentGoogleTokens(auth);
    }

    if (GoogleSignin.hasPreviousSignIn()) {
      const silentResult = await GoogleSignin.signInSilently();
      if (silentResult.type === 'success') {
        return signInFirebaseWithCurrentGoogleTokens(auth);
      }
    }
  } catch {
    // Cached native Google state can disappear after reinstall, revocation, or key changes.
  }

  if (!interactive) return null;
  return signInGoogleFirebaseSession();
}

async function signInGoogleFirebaseSession(): Promise<FirebaseAuthTypes.User | null> {
  const auth = getConfiguredAuth();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn({
    loginHint: auth.currentUser?.email ?? undefined,
  });
  if (!isSuccessResponse(response)) return null;

  return signInFirebaseWithCurrentGoogleTokens(auth);
}

async function signInFirebaseWithCurrentGoogleTokens(auth: ReturnType<typeof getAuth>) {
  const { accessToken, idToken } = await GoogleSignin.getTokens();
  if (!idToken) {
    throw new Error('Google did not return an ID token. Check the Firebase web client ID.');
  }

  const credential = GoogleAuthProvider.credential(idToken, accessToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

function getConfiguredAuth() {
  try {
    return getAuth();
  } catch {
    throw new Error(FIREBASE_NOT_CONFIGURED_MESSAGE);
  }
}

function accountUserFromFirebaseUser(firebaseUser: FirebaseAuthTypes.User): AccountAuthUser {
  const email = firebaseUser.email ?? '';
  const name = firebaseUser.displayName ?? email ?? firebaseUser.uid;

  return {
    email,
    id: firebaseUser.uid,
    name,
    picture: firebaseUser.photoURL ?? undefined,
    verifiedEmail: firebaseUser.emailVerified,
  };
}

export function accountAuthErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') return 'Google sign-in failed.';

  const code = 'code' in error ? String(error.code) : '';
  const message = 'message' in error ? String(error.message) : '';
  const detail = `${code} ${message}`;

  if (code === statusCodes.SIGN_IN_CANCELLED || /cancel/i.test(detail)) {
    return 'Google sign-in was cancelled.';
  }
  if (code === statusCodes.IN_PROGRESS) {
    return 'Google sign-in is already in progress.';
  }
  if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    return 'Google Play Services is not available or needs to be updated.';
  }
  if (code === '10' || /DEVELOPER_ERROR/i.test(detail)) {
    return 'Google OAuth client does not match this package name and SHA-1 certificate.';
  }
  if (/No Firebase App|Firebase Auth is not configured/i.test(detail)) {
    return FIREBASE_NOT_CONFIGURED_MESSAGE;
  }
  if (/GoogleService-Info|missing support.*URL schemes|iosClientId|clientID/i.test(detail)) {
    return 'iOS Google Sign-In is not configured. Add the correct GoogleService-Info.plist for com.vinago.plus and rebuild.';
  }

  return message || 'Google sign-in failed.';
}
