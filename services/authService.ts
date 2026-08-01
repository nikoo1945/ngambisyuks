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

// Firebase Config loaded with exact defaults, env variables, or firebase-applet-config.json
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDtrZIf1tvZnmUM1yU-l59R6E4sOBrsHBU",
  authDomain: "tugasin-app.firebaseapp.com",
  projectId: "tugasin-app",
  storageBucket: "tugasin-app.firebasestorage.app",
  messagingSenderId: "937004057977",
  appId: "1:937004057977:web:f2f57d09a565ec07619ba8"
};

let firebaseConfig: any = {
  apiKey: rawApiKey || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: rawAuthDomain ? cleanAuthDomain(rawAuthDomain, rawProjectId) : DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: rawProjectId || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: getCleanEnv(import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: getCleanEnv(import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: getCleanEnv(import.meta.env?.VITE_FIREBASE_APP_ID) || DEFAULT_FIREBASE_CONFIG.appId
};

try {
  const configModule = require('../firebase-applet-config.json');
  if (configModule && configModule.apiKey) {
    firebaseConfig = {
      ...firebaseConfig,
      ...configModule,
      authDomain: cleanAuthDomain(configModule.authDomain || firebaseConfig.authDomain, configModule.projectId || firebaseConfig.projectId)
    };
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

