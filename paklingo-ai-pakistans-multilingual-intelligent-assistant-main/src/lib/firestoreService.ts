import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface FirestoreUserProfile {
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'email';
  emailVerified: boolean;
  updatedAt?: string;
  createdAt?: string;
}

export interface FirestoreConversation {
  id?: string;
  userId: string;
  title: string;
  category: string;
  language: string;
  subtitle?: string;
  type?: 'chat' | 'translate' | 'document' | 'activity';
  module?: string;
  targetPage?: string;
  createdAt: string;
}

/**
 * Persists and updates user profile in Firestore
 */
export async function syncUserProfileToFirestore(
  userId: string,
  profile: {
    email: string;
    name: string;
    avatar?: string;
    provider?: 'google' | 'email';
    emailVerified?: boolean;
  }
): Promise<void> {
  if (!userId || !db) return;

  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        email: profile.email || '',
        name: profile.name || profile.email?.split('@')[0] || 'User',
        avatar: profile.avatar || '',
        provider: profile.provider || 'google',
        emailVerified: profile.emailVerified ?? true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    }
    console.warn('Firestore user profile sync note:', error);
  }
}

/**
 * Saves a conversation or activity record to Firestore
 */
export async function saveConversationToFirestore(
  conversation: FirestoreConversation
): Promise<string | null> {
  if (!conversation.userId || !db) return null;

  const convId = conversation.id || `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `conversations/${convId}`;

  try {
    const convRef = doc(db, 'conversations', convId);
    const dataToSave: any = {
      userId: conversation.userId,
      title: conversation.title.slice(0, 500),
      category: (conversation.category || 'General').slice(0, 100),
      language: (conversation.language || 'en').slice(0, 50),
      subtitle: (conversation.subtitle || '').slice(0, 1000),
      createdAt: conversation.createdAt || new Date().toISOString(),
    };
    if (conversation.type) dataToSave.type = conversation.type;
    if (conversation.module) dataToSave.module = conversation.module.slice(0, 100);
    if (conversation.targetPage) dataToSave.targetPage = conversation.targetPage.slice(0, 50);

    await setDoc(convRef, dataToSave);
    return convId;
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
    console.warn('Firestore conversation save note:', error);
    return null;
  }
}

/**
 * Loads conversations for a specific user from Firestore
 */
export async function getUserConversationsFromFirestore(
  userId: string
): Promise<FirestoreConversation[]> {
  if (!userId || !db) return [];

  const path = 'conversations';
  try {
    const q = query(collection(db, path), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const conversations: FirestoreConversation[] = [];
    querySnapshot.forEach((docSnap) => {
      conversations.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });
    // Sort descending by creation date
    conversations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return conversations;
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.LIST, path);
    }
    console.warn('Firestore conversation fetch note:', error);
    return [];
  }
}

/**
 * Deletes a single conversation document from Firestore
 */
export async function deleteConversationFromFirestore(
  conversationId: string
): Promise<boolean> {
  if (!conversationId || !db) return false;

  const path = `conversations/${conversationId}`;
  try {
    const convRef = doc(db, 'conversations', conversationId);
    await deleteDoc(convRef);
    return true;
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
    console.warn('Firestore conversation delete note:', error);
    return false;
  }
}

/**
 * Clears all conversation documents for a user from Firestore
 */
export async function clearUserConversationsFromFirestore(
  userId: string
): Promise<boolean> {
  if (!userId || !db) return false;

  const path = 'conversations';
  try {
    const q = query(collection(db, path), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return true;

    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
    return true;
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
    console.warn('Firestore clear conversations note:', error);
    return false;
  }
}

/**
 * Unified Activity Logger:
 * Persists an activity entry to Firestore (when authenticated) and to localStorage.
 */
export async function recordUserActivity(activity: {
  userId?: string | null;
  type: 'chat' | 'translate' | 'document' | 'activity';
  title: string;
  subtitle?: string;
  module: string;
  targetPage: string;
  language: string;
}): Promise<void> {
  const newEntry = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: activity.type,
    title: activity.title,
    subtitle: activity.subtitle || '',
    module: activity.module,
    targetPage: activity.targetPage,
    timestamp: 'Just now',
    createdAt: new Date().toISOString(),
    language: activity.language,
  };

  // 1. Always update local storage for immediate responsiveness
  try {
    const saved = localStorage.getItem('paklingo_recent_history');
    let list = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(list)) list = [];
    // Prepend new entry, limit to 50
    list = [newEntry, ...list.filter((item: any) => item.title !== activity.title)].slice(0, 50);
    localStorage.setItem('paklingo_recent_history', JSON.stringify(list));
  } catch {
    // ignore local storage errors
  }

  // 2. Persist to Firestore if user is authenticated
  if (activity.userId) {
    try {
      await saveConversationToFirestore({
        id: newEntry.id,
        userId: activity.userId,
        title: activity.title,
        category: activity.module,
        language: activity.language,
        subtitle: activity.subtitle || '',
        type: activity.type,
        module: activity.module,
        targetPage: activity.targetPage,
        createdAt: newEntry.createdAt,
      });
    } catch (e) {
      console.warn('Could not sync activity to Firestore:', e);
    }
  }
}
