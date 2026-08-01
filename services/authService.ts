import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';

// Helper to clean Firebase config values from env variables
const getCleanEnv = (val: string | undefined): string => {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
};

const rawApiKey = getCleanEnv(import.meta.env?.VITE_FIREBASE_API_KEY);
const rawAuthDomain = getCleanEnv(import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN);
const rawProjectId = getCleanEnv(import.meta.env?.VITE_FIREBASE_PROJECT_ID) || "tugasin-app";

const cleanAuthDomain = (domain: string, projId: string): string => {
  let cleaned = domain.replace(/^https?:\/\//i, '').replace(/^\/+|\/+$/g, '').trim();
  if (!cleaned || cleaned.startsWith('.') || cleaned === 'firebaseapp.com' || !cleaned.includes('.')) {
    return `${projId}.firebaseapp.com`;
  }
  return cleaned;
};

// Firebase Config loaded from VITE_ env variables, firebase-applet-config.json if present, or fallback
let firebaseConfig: any = {
  apiKey: rawApiKey || "AIzaSyDummyKeyForWorkspaceAuth",
  authDomain: cleanAuthDomain(rawAuthDomain, rawProjectId),
  projectId: rawProjectId,
  storageBucket: getCleanEnv(import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || `${rawProjectId}.appspot.com`,
  messagingSenderId: getCleanEnv(import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || "1234567890",
  appId: getCleanEnv(import.meta.env?.VITE_FIREBASE_APP_ID) || "1:1234567890:web:abcdef123456"
};

try {
  const configModule = require('../firebase-applet-config.json');
  if (configModule && configModule.apiKey && !configModule.apiKey.includes('DummyKey')) {
    firebaseConfig = configModule;
  }
} catch (e) {
  // Config json fallback
}

export const isFirebaseConfigured = (): boolean => {
  return !!(
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes('DummyKey') &&
    firebaseConfig.apiKey.length > 20
  );
};

let app: any;
let auth: any;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
} catch (err) {
  console.warn('Firebase init warning:', err);
}

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.addScope('https://www.googleapis.com/auth/documents');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }

  return onAuthStateChanged(auth, async (currentUser: User | null) => {
    if (currentUser) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(currentUser, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string; isDemo?: boolean } | null> => {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase API Key belum terpasang di Vercel. Silakan tambahkan VITE_FIREBASE_API_KEY dan VITE_FIREBASE_AUTH_DOMAIN di Vercel -> Project Settings -> Environment Variables, lalu lakukan REDEPLOY pada Vercel.'
    );
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google Sign-In');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken, isDemo: false };
  } catch (error: any) {
    console.error('Sign in error:', error);
    // Return real error message so user can see what Firebase error occurred
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  if (auth) {
    try {
      await auth.signOut();
    } catch {}
  }
  cachedAccessToken = null;
};

