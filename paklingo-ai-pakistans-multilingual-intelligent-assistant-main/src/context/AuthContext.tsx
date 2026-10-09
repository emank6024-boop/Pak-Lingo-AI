import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Telemetry } from '../lib/telemetry';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  linkWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  signOut,
  checkRedirectResult,
} from '../lib/firebase';
import { syncUserProfileToFirestore } from '../lib/firestoreService';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'google' | 'email';
  emailVerified: boolean;
  createdAt: string;
}

export interface VerificationResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    password: string,
    confirmPassword: string,
    name?: string
  ) => Promise<{ verificationLink?: string; verificationToken?: string }>;
  loginWithGoogle: (payload: {
    accessToken?: string;
    credential?: string;
    idToken?: string;
    profile?: { email: string; name: string; avatar?: string; googleId?: string };
  }) => Promise<void>;
  verifyEmail: (token: string) => Promise<VerificationResult>;
  resendVerification: (email?: string) => Promise<{ success: boolean; message?: string; verificationLink?: string; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string; resetLink?: string; resetToken?: string; error?: string }>;
  resetPassword: (
    token: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'paklingo_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate active session token against server on initial load
  const validateSession = useCallback(async (authToken: string | null) => {
    if (!authToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          Telemetry.syncUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            provider: data.user.provider,
          });
        } else {
          // Stale session
          setUser(null);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setToken(null);
        }
      } else {
        // Token invalid or expired
        setUser(null);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
      }
    } catch (err) {
      console.warn('Session verification error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Check if user is returning from a Firebase Google sign-in redirect
    checkRedirectResult()
      .then(async (redirectResult) => {
        if (!isMounted || !redirectResult?.user) return;
        try {
          const fbUser = redirectResult.user;
          const idToken = await fbUser.getIdToken();
          const isGoogle = fbUser.providerData?.some((p) => p.providerId === 'google.com');
          const profile: UserProfile = {
            id: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            avatar: fbUser.photoURL || undefined,
            provider: isGoogle ? 'google' : 'email',
            emailVerified: fbUser.emailVerified,
            createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
          };

          // Sync user profile to Firestore
          syncUserProfileToFirestore(fbUser.uid, {
            email: profile.email,
            name: profile.name,
            avatar: profile.avatar,
            provider: profile.provider,
            emailVerified: profile.emailVerified,
          }).catch((err) => console.warn('Firestore sync note on redirect:', err));

          saveSession(idToken, profile);
          setIsLoading(false);
        } catch (redirSyncErr) {
          console.warn('Redirect sync error in AuthContext:', redirSyncErr);
        }
      })
      .catch((err) => {
        console.warn('AuthContext checkRedirectResult notice:', err);
      });

    // Check stored server session token immediately on mount to prevent auth flickering
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedToken) {
      validateSession(storedToken);
    }

    // Listen to Firebase Authentication state for live sync
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!isMounted) return;

      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          const isGoogle = fbUser.providerData?.some((p) => p.providerId === 'google.com');
          const profile: UserProfile = {
            id: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            avatar: fbUser.photoURL || undefined,
            provider: isGoogle ? 'google' : 'email',
            emailVerified: fbUser.emailVerified,
            createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
          };

          // Sync user profile to Firestore
          syncUserProfileToFirestore(fbUser.uid, {
            email: profile.email,
            name: profile.name,
            avatar: profile.avatar,
            provider: profile.provider,
            emailVerified: profile.emailVerified,
          }).catch((err) => console.warn('Firestore sync note on auth change:', err));

          saveSession(idToken, profile);
          setIsLoading(false);
          return;
        } catch (syncErr) {
          console.warn('Firebase session restore note:', syncErr);
        }
      }

      // If no active Firebase user and no stored token, clear session
      const currentStoredToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!currentStoredToken && isMounted) {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [validateSession]);

  const saveSession = (authToken: string, authUser: UserProfile) => {
    setToken(authToken);
    setUser(authUser);
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
    } catch {}
    Telemetry.syncUser({
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      provider: authUser.provider,
    });
  };

  /**
   * Secure Email & Password Login using Firebase Authentication
   */
  const loginWithEmail = async (emailInput: string, passwordInput: string) => {
    setIsLoading(true);
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput;

    try {
      let firebaseUser: any = null;

      // 1. Primary authentication via Firebase Email/Password
      try {
        const userCred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        firebaseUser = userCred.user;
      } catch (fbErr: any) {
        console.warn('Firebase Client Email sign-in attempt:', fbErr?.code, fbErr?.message);
        // Fallback to server-side login for migration / network handling
      }

      // If Firebase authenticated successfully
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        const profile: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email || cleanEmail,
          name: firebaseUser.displayName || cleanEmail.split('@')[0],
          avatar: firebaseUser.photoURL || undefined,
          provider: 'email',
          emailVerified: firebaseUser.emailVerified,
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
        };

        // Sync user profile to Firestore
        syncUserProfileToFirestore(firebaseUser.uid, {
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
          provider: 'email',
          emailVerified: firebaseUser.emailVerified,
        }).catch((err) => console.warn('Firestore sync note:', err));

        saveSession(idToken, profile);
        return;
      }

      // 2. Server-side login (uses Firebase REST & handles migration for legacy accounts)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Incorrect email or password.');
      }

      saveSession(data.token, data.user);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Secure Email Registration using Firebase Authentication
   */
  const registerWithEmail = async (
    emailInput: string,
    passwordInput: string,
    confirmPasswordInput: string,
    nameInput?: string
  ) => {
    setIsLoading(true);
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput;
    const formattedName =
      nameInput?.trim() ||
      cleanEmail.split('@')[0].replace(/[._]/g, ' ') ||
      'PakLingo User';

    if (cleanPassword !== confirmPasswordInput) {
      setIsLoading(false);
      throw new Error('Passwords do not match. Please verify both password fields.');
    }

    try {
      let firebaseUser: any = null;

      // 1. Primary registration with Firebase Authentication
      try {
        const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        firebaseUser = userCred.user;
        if (firebaseUser) {
          await updateProfile(firebaseUser, { displayName: formattedName });
          sendEmailVerification(firebaseUser).catch((e) =>
            console.warn('Firebase email verification notice:', e)
          );
        }
      } catch (fbErr: any) {
        console.warn('Firebase createUserWithEmailAndPassword notice:', fbErr?.code, fbErr?.message);

        // Account linking: If email already exists in Firebase (e.g. registered via Google)
        if (fbErr?.code === 'auth/email-already-in-use') {
          if (auth.currentUser && auth.currentUser.email === cleanEmail) {
            try {
              const cred = EmailAuthProvider.credential(cleanEmail, cleanPassword);
              await linkWithCredential(auth.currentUser, cred);
              firebaseUser = auth.currentUser;
            } catch (linkErr) {
              console.warn('Firebase in-session account link:', linkErr);
            }
          }
        }
      }

      // If Firebase user created or linked
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        const profile: UserProfile = {
          id: firebaseUser.uid,
          email: cleanEmail,
          name: formattedName,
          provider: 'email',
          emailVerified: firebaseUser.emailVerified,
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
        };

        syncUserProfileToFirestore(firebaseUser.uid, {
          email: cleanEmail,
          name: formattedName,
          provider: 'email',
          emailVerified: firebaseUser.emailVerified,
        }).catch((e) => console.warn('Firestore sync note:', e));

        saveSession(idToken, profile);
        return {};
      }

      // 2. Server-side registration fallback via Firebase Identity Toolkit
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
          confirmPassword: confirmPasswordInput,
          name: formattedName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create account.');
      }

      saveSession(data.token, data.user);
      return {};
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Google OAuth Authentication via Firebase
   */
  const loginWithGoogle = async (payload: {
    accessToken?: string;
    credential?: string;
    idToken?: string;
    profile?: { email: string; name: string; avatar?: string; googleId?: string };
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Google authentication failed.');
      }

      saveSession(data.token, data.user);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify Email
   */
  const verifyEmail = async (verifyToken: string): Promise<VerificationResult> => {
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyToken }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (user) {
          setUser({ ...user, emailVerified: true });
        }
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Email verification failed.' };
    } catch {
      return { success: false, error: 'Network error verifying email. Please try again.' };
    }
  };

  /**
   * Resend Verification Email
   */
  const resendVerification = async (targetEmail?: string) => {
    try {
      if (auth.currentUser) {
        try {
          await sendEmailVerification(auth.currentUser);
          return {
            success: true,
            message: 'A fresh verification email has been sent to your inbox.',
          };
        } catch (fbErr) {
          console.warn('Client Firebase sendEmailVerification notice:', fbErr);
        }
      }

      const emailToSend = targetEmail || user?.email;
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSend, idToken: token }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message,
        };
      }
      return { success: false, error: data.error || 'Failed to resend verification.' };
    } catch {
      return { success: false, error: 'Network error resending verification.' };
    }
  };

  /**
   * Request Password Reset
   */
  const requestPasswordReset = async (email: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Send password reset email directly via Firebase Client SDK
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
        return {
          success: true,
          message: 'Password reset instructions sent to your email.',
        };
      } catch (clientFbErr: any) {
        console.warn('Client Firebase sendPasswordResetEmail notice:', clientFbErr?.code);
      }

      // 2. Server-side fallback via Firebase Identity Toolkit
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message,
          resetLink: data.resetLink,
          resetToken: data.resetToken,
        };
      }
      return { success: false, error: data.error || 'Failed to send password reset.' };
    } catch {
      return { success: false, error: 'Network error requesting password reset.' };
    }
  };

  /**
   * Reset Password
   */
  const resetPassword = async (
    resetToken: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Failed to reset password.' };
    } catch {
      return { success: false, error: 'Network error resetting password.' };
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {}
  };

  const refreshUser = async () => {
    if (token) {
      await validateSession(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        token,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        verifyEmail,
        resendVerification,
        requestPasswordReset,
        resetPassword,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
