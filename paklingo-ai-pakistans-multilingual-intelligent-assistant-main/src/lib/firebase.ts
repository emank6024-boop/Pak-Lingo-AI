import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  EmailAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  linkWithCredential,
  fetchSignInMethodsForEmail,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
  Auth,
  User,
  UserCredential,
  AuthCredential,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Standard Firebase Web SDK configuration using credentials provisioned by Google AI Studio
export const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
  measurementId: firebaseConfigJson.measurementId || undefined,
};

// Initialize Firebase App safely and idempotently
export const app: FirebaseApp = getApps().length > 0 
  ? getApp() 
  : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);

// Explicitly guarantee session persistence across browser refreshes and tab closures
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase setPersistence notice:', err);
});
export const db: Firestore = firebaseConfigJson.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

// Test connection on boot per Firebase skill guidelines
async function testConnection() {
  try {
    const { doc, getDocFromServer } = await import('firebase/firestore');
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    // Permission-denied is normal when unauthenticated if security rules require auth
    if (error?.code === 'permission-denied') {
      return;
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Please check network configuration.');
    }
  }
}
testConnection();

// Official GoogleAuthProvider for Firebase Authentication
export const googleAuthProvider = new GoogleAuthProvider();

// Explicitly add Google identity scopes
googleAuthProvider.addScope('email');
googleAuthProvider.addScope('profile');
googleAuthProvider.addScope('openid');

// Request select_account prompt to ensure real Google account chooser dialog is presented
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Initiates the official Firebase Google Sign-In popup flow using GoogleAuthProvider.
 */
export async function signInWithGooglePopup(): Promise<UserCredential> {
  return await signInWithPopup(auth, googleAuthProvider);
}

/**
 * Initiates the official Firebase Google Sign-In redirect flow using GoogleAuthProvider.
 */
export async function signInWithGoogleRedirect(): Promise<void> {
  return await signInWithRedirect(auth, googleAuthProvider);
}

/**
 * Checks for any pending redirect result when returning from OAuth redirect flow.
 */
export async function checkRedirectResult(): Promise<UserCredential | null> {
  return await getRedirectResult(auth);
}

export {
  signInWithCredential,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  linkWithCredential,
  fetchSignInMethodsForEmail,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  EmailAuthProvider,
  firebaseConfigJson,
};
export type { User, UserCredential, AuthCredential };


