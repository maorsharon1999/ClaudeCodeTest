/**
 * Firebase JS SDK initializer (Phase 1 — Phone Auth).
 *
 * isFirebaseEnabled() returns true only when all required env vars are set.
 * When false, the auth screens fall back to the existing console-stub OTP flow,
 * so the app keeps working in dev without a real Firebase project.
 *
 * On React Native (Expo bare/dev-client), RecaptchaVerifier is not available.
 * signInWithPhoneNumber on the JS SDK works via the Firebase web flow with
 * invisible reCAPTCHA on Expo web, and via @react-native-firebase on native.
 * For the MVP, Firebase auth is fully tested on Expo web; native builds use
 * @react-native-firebase (Phase 1b).
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const FIREBASE_API_KEY     = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const FIREBASE_AUTH_DOMAIN = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
const FIREBASE_PROJECT_ID  = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;

export function isFirebaseEnabled() {
  return !!(FIREBASE_API_KEY && FIREBASE_AUTH_DOMAIN && FIREBASE_PROJECT_ID);
}

let _auth = null;

export function getFirebaseAuth() {
  if (_auth) return _auth;

  if (!isFirebaseEnabled()) {
    throw new Error(
      'Firebase is not configured. Set EXPO_PUBLIC_FIREBASE_API_KEY, ' +
      'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, and EXPO_PUBLIC_FIREBASE_PROJECT_ID in .env.'
    );
  }

  const firebaseConfig = {
    apiKey:     FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId:  FIREBASE_PROJECT_ID,
  };

  const app = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

  _auth = getAuth(app);
  return _auth;
}

/**
 * Sign in or register a user with email + password via Firebase.
 * Returns the Firebase UserCredential.
 */
export async function signInOrRegisterWithEmail(email, password, isRegistering) {
  const auth = getFirebaseAuth();
  if (isRegistering) {
    return createUserWithEmailAndPassword(auth, email, password);
  }
  return signInWithEmailAndPassword(auth, email, password);
}
