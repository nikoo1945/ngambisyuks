import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';

// Firebase Config loaded from VITE_ env variables, firebase-applet-config.json if present, or fallback
let firebaseConfig: any = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForWorkspaceAuth",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "tugasin-app.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "tugasin-app",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "tugasin-app.appspot.com",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
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
    console.warn('Firebase API key dummy or missing. Falling back to Demo Workspace mode.');
    cachedAccessToken = 'demo-workspace-access-token';
    const mockUser = {
      uid: 'demo-google-user-123',
      displayName: 'Pengguna Google (Demo Mode)',
      email: 'user@gmail.com',
      photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=Tugasin'
    } as unknown as User;
    
    return { user: mockUser, accessToken: cachedAccessToken, isDemo: true };
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
    if (
      error?.code === 'auth/api-key-not-valid' ||
      error?.code === 'auth/invalid-api-key' ||
      error?.message?.includes('api-key-not-valid')
    ) {
      // Automatic fallback to Demo mode if API key fails validation in Vercel
      console.warn('Invalid Firebase API key on Vercel. Enabling Demo Workspace Mode.');
      cachedAccessToken = 'demo-workspace-access-token';
      const mockUser = {
        uid: 'demo-google-user-123',
        displayName: 'Pengguna Google Workspace (Demo)',
        email: 'user@gmail.com',
        photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=Tugasin'
      } as unknown as User;
      return { user: mockUser, accessToken: cachedAccessToken, isDemo: true };
    }
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

