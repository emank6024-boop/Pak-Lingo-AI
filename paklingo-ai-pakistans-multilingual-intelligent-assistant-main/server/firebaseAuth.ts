import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { AuthService, StoredUser } from './authService.js';

export interface FirebaseUser {
  id: string; // Firebase UID
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'email';
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthenticatedRequest extends Request {
  user?: FirebaseUser;
}

// Load Firebase configuration provisioned for this applet
let firebaseApiKey = '';
let firebaseProjectId = '';

try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    firebaseApiKey = config.apiKey || '';
    firebaseProjectId = config.projectId || '';
  }
} catch (err) {
  console.warn('Could not read firebase-applet-config.json:', err);
}

// In-memory verification cache to avoid excessive network requests on repeated calls
interface CachedSession {
  user: FirebaseUser;
  expiresAt: number;
}

const tokenCache = new Map<string, CachedSession>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Clean up expired cached tokens periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of tokenCache.entries()) {
    if (session.expiresAt <= now) {
      tokenCache.delete(token);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Verifies a Firebase ID token using Google's Identity Toolkit API.
 * Returns the sanitized FirebaseUser profile or null if invalid/expired.
 */
export async function verifyFirebaseToken(idToken: string): Promise<FirebaseUser | null> {
  if (!idToken || typeof idToken !== 'string') return null;

  const cleanToken = idToken.trim();
  const cached = tokenCache.get(cleanToken);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }

  if (!firebaseApiKey) {
    console.error('Firebase API Key missing from configuration.');
    return null;
  }

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: cleanToken }),
      }
    );

    if (!response.ok) {
      tokenCache.delete(cleanToken);
      return null;
    }

    const data = await response.json();
    if (!data.users || data.users.length === 0) {
      tokenCache.delete(cleanToken);
      return null;
    }

    const fbUser = data.users[0];
    const isGoogle = fbUser.providerUserInfo?.some(
      (p: { providerId: string }) => p.providerId === 'google.com'
    );

    const user: FirebaseUser = {
      id: fbUser.localId,
      email: fbUser.email || '',
      name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
      avatar: fbUser.photoUrl || undefined,
      provider: isGoogle ? 'google' : 'email',
      emailVerified: Boolean(fbUser.emailVerified),
      createdAt: fbUser.createdAt
        ? new Date(Number(fbUser.createdAt)).toISOString()
        : new Date().toISOString(),
    };

    tokenCache.set(cleanToken, {
      user,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return user;
  } catch (err) {
    console.error('Error verifying Firebase ID token:', err);
    return null;
  }
}

/**
 * Sign In with Email & Password via Firebase Identity Toolkit
 * With seamless automatic migration for users previously registered in data/users.json
 */
export async function signInWithEmailAndPasswordServer(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; token?: string; user?: FirebaseUser; error?: string }> {
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanPassword = passwordInput;

  if (!cleanEmail || !cleanPassword) {
    return { success: false, error: 'Email and password are required.' };
  }

  try {
    // 1. Primary: Attempt sign in via Firebase Auth
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
          returnSecureToken: true,
        }),
      }
    );

    const data = await res.json();

    if (res.ok && data.idToken) {
      const user = await verifyFirebaseToken(data.idToken);
      if (user) {
        return { success: true, token: data.idToken, user };
      }
    }

    // 2. Fallback / Migration: If user does not exist in Firebase yet, check legacy users.json
    const errorCode = data.error?.message;
    if (errorCode === 'EMAIL_NOT_FOUND' || errorCode === 'INVALID_PASSWORD') {
      const legacyUser = AuthService.getUserByEmail(cleanEmail);
      if (legacyUser && legacyUser.passwordSalt && legacyUser.passwordHash) {
        const isLegacyValid = AuthService.verifyPassword(
          cleanPassword,
          legacyUser.passwordSalt,
          legacyUser.passwordHash
        );

        if (isLegacyValid) {
          // User verified against legacy PBKDF2 hash! Migrate to Firebase Auth
          const migrated = await signUpWithEmailAndPasswordServer(
            cleanEmail,
            cleanPassword,
            legacyUser.name
          );
          if (migrated.success && migrated.token && migrated.user) {
            console.log(`Successfully migrated legacy user ${cleanEmail} to Firebase Auth.`);
            return migrated;
          }
        }
      }
    }

    let friendlyError = 'Incorrect email or password.';
    if (errorCode === 'EMAIL_NOT_FOUND') {
      friendlyError = 'No account found with this email address. Please sign up.';
    } else if (errorCode === 'INVALID_PASSWORD') {
      friendlyError = 'Incorrect password. Please try again or reset your password.';
    } else if (errorCode === 'USER_DISABLED') {
      friendlyError = 'This user account has been disabled. Please contact support.';
    }

    return { success: false, error: friendlyError };
  } catch (err: any) {
    console.error('Firebase server sign in error:', err);
    return { success: false, error: 'Authentication service temporarily unavailable.' };
  }
}

/**
 * Sign Up with Email & Password via Firebase Identity Toolkit
 */
export async function signUpWithEmailAndPasswordServer(
  emailInput: string,
  passwordInput: string,
  nameInput?: string
): Promise<{ success: boolean; token?: string; user?: FirebaseUser; error?: string }> {
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanPassword = passwordInput;
  const formattedName =
    nameInput?.trim() || cleanEmail.split('@')[0].replace(/[._]/g, ' ') || 'PakLingo User';

  if (!cleanEmail || !cleanPassword) {
    return { success: false, error: 'Email and password are required.' };
  }
  if (cleanPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  try {
    // 1. Create account in Firebase Auth
    const signUpRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
          returnSecureToken: true,
        }),
      }
    );

    const signUpData = await signUpRes.json();
    if (!signUpRes.ok || !signUpData.idToken) {
      const msg = signUpData.error?.message;
      if (msg === 'EMAIL_EXISTS') {
        return {
          success: false,
          error: 'An account with this email already exists. Please sign in instead.',
        };
      }
      return { success: false, error: msg || 'Failed to create user account in Firebase.' };
    }

    const idToken = signUpData.idToken;

    // 2. Set user display name
    try {
      await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${firebaseApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken,
            displayName: formattedName,
            returnSecureToken: true,
          }),
        }
      );
    } catch (updateErr) {
      console.warn('Notice setting display name during Firebase signup:', updateErr);
    }

    // 3. Trigger email verification
    try {
      await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${firebaseApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestType: 'VERIFY_EMAIL',
            idToken,
          }),
        }
      );
    } catch (verifErr) {
      console.warn('Notice sending email verification during Firebase signup:', verifErr);
    }

    const user = await verifyFirebaseToken(idToken);
    return {
      success: true,
      token: idToken,
      user: user || {
        id: signUpData.localId,
        email: cleanEmail,
        name: formattedName,
        provider: 'email',
        emailVerified: false,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    console.error('Firebase server signup error:', err);
    return { success: false, error: 'Failed to create account. Please try again.' };
  }
}

/**
 * Send Password Reset Email via Firebase Identity Toolkit
 */
export async function sendPasswordResetEmailServer(
  emailInput: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const cleanEmail = emailInput.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${firebaseApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email: cleanEmail,
        }),
      }
    );

    const data = await res.json();
    if (res.ok) {
      return {
        success: true,
        message: 'Password reset instructions have been sent to your email address.',
      };
    }

    return { success: false, error: data.error?.message || 'Failed to send password reset.' };
  } catch (err: any) {
    console.error('Firebase password reset request error:', err);
    return { success: false, error: 'Failed to process password reset request.' };
  }
}

/**
 * Complete Password Reset with OOB Code via Firebase Identity Toolkit
 */
export async function confirmPasswordResetServer(
  oobCode: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!oobCode || !newPassword) {
    return { success: false, error: 'Reset token and new password are required.' };
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${firebaseApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oobCode,
          newPassword,
        }),
      }
    );

    const data = await res.json();
    if (res.ok) {
      return {
        success: true,
        message: 'Your password has been successfully reset. You can now sign in.',
      };
    }

    return {
      success: false,
      error: data.error?.message || 'The password reset link is invalid or has expired.',
    };
  } catch (err: any) {
    console.error('Firebase password reset confirmation error:', err);
    return { success: false, error: 'Failed to reset password.' };
  }
}

/**
 * Resend Email Verification via Firebase Identity Toolkit
 */
export async function resendEmailVerificationServer(
  idTokenOrEmail: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // If given an ID token
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${firebaseApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'VERIFY_EMAIL',
          idToken: idTokenOrEmail,
        }),
      }
    );

    if (res.ok) {
      return { success: true, message: 'A fresh verification email has been sent.' };
    }

    return { success: true, message: 'Verification request received.' };
  } catch {
    return { success: true, message: 'Verification request processed.' };
  }
}

/**
 * Invalidate cached token on logout
 */
export function invalidateFirebaseToken(idToken: string): void {
  if (idToken) {
    tokenCache.delete(idToken.trim());
  }
}

/**
 * Express Middleware: Require Valid Firebase Authentication
 * Enforces server-side session verification by checking Bearer Firebase ID token.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication required. Please provide a valid Firebase authorization token.',
    });
  }

  const token = authHeader.substring(7).trim();
  const user = await verifyFirebaseToken(token);

  if (!user) {
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Your authentication session is invalid or has expired. Please sign in again.',
    });
  }

  req.user = user;
  next();
}

/**
 * Express Middleware: Optional Firebase Authentication
 * Attaches req.user if a valid Firebase ID token is present, without blocking unauthenticated visitors.
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const user = await verifyFirebaseToken(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}
