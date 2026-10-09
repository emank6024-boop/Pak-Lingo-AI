/**
 * ============================================================================
 * @deprecated
 * DEPRECATION NOTICE (Phase 1 Migration):
 * PakLingo AI has migrated to Firebase Auth as the single source of truth.
 * Server session verification now uses Firebase ID tokens directly (via server/firebaseAuth.ts).
 * This file and its JSON data stores (data/users.json, data/sessions.json) are deprecated
 * and retained temporarily for migration verification and backward compatibility.
 * Do not add new features to this service.
 * ============================================================================
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  passwordSalt?: string;
  provider: 'email' | 'google';
  googleId?: string;
  avatar?: string;
  emailVerified: boolean;
  verificationToken?: string | null;
  verificationTokenExpires?: number | null;
  resetToken?: string | null;
  resetTokenExpires?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SanitizedUser {
  id: string;
  email: string;
  name: string;
  provider: 'email' | 'google';
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface StoredSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create data directory:', e);
  }
}

// In-memory cache synced with disk
let usersCache: Map<string, StoredUser> = new Map();
let sessionsCache: Map<string, StoredSession> = new Map();

function loadUsers(): void {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      const users: StoredUser[] = JSON.parse(data);
      usersCache = new Map(users.map((u) => [u.id, u]));
    } else {
      usersCache = new Map();
      saveUsers();
    }
  } catch (err) {
    console.error('Failed to read users file:', err);
    usersCache = new Map();
  }
}

function saveUsers(): void {
  try {
    const list = Array.from(usersCache.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save users file:', err);
  }
}

function loadSessions(): void {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      const sessions: StoredSession[] = JSON.parse(data);
      const now = Date.now();
      // Filter out expired sessions
      sessionsCache = new Map(
        sessions.filter((s) => s.expiresAt > now).map((s) => [s.token, s])
      );
    } else {
      sessionsCache = new Map();
      saveSessions();
    }
  } catch (err) {
    console.error('Failed to read sessions file:', err);
    sessionsCache = new Map();
  }
}

function saveSessions(): void {
  try {
    const list = Array.from(sessionsCache.values());
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save sessions file:', err);
  }
}

// Initial load
loadUsers();
loadSessions();

export class AuthService {
  /**
   * Hashes a password using PBKDF2 with SHA-512 and unique salt (100,000 rounds)
   */
  static hashPassword(password: string): { salt: string; hash: string } {
    const salt = crypto.randomBytes(32).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return { salt, hash };
  }

  /**
   * Verifies a password against the stored salt and hash using timing-safe comparison
   */
  static verifyPassword(password: string, salt: string, storedHash: string): boolean {
    try {
      const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
      const bufA = Buffer.from(hash, 'hex');
      const bufB = Buffer.from(storedHash, 'hex');
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  /**
   * Strips sensitive fields (hashes, salts, tokens) before sending to client
   */
  static sanitizeUser(user: StoredUser): SanitizedUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  }

  /**
   * Creates a cryptographically random session token for an authenticated user
   */
  static createSession(userId: string): { token: string; expiresAt: number } {
    const token = 'pkt_' + crypto.randomBytes(48).toString('hex');
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    const session: StoredSession = {
      token,
      userId,
      createdAt: Date.now(),
      expiresAt,
    };
    sessionsCache.set(token, session);
    saveSessions();
    return { token, expiresAt };
  }

  /**
   * Validates a session token and returns the sanitized user
   */
  static getUserBySessionToken(token: string): SanitizedUser | null {
    if (!token) return null;
    const session = sessionsCache.get(token);
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      sessionsCache.delete(token);
      saveSessions();
      return null;
    }

    const user = usersCache.get(session.userId);
    if (!user) return null;

    return this.sanitizeUser(user);
  }

  /**
   * Internal helper to lookup stored user by email
   */
  static getUserByEmail(email: string): StoredUser | undefined {
    const clean = (email || '').trim().toLowerCase();
    return Array.from(usersCache.values()).find((u) => u.email === clean);
  }

  /**
   * Invalidate session (logout)
   */
  static invalidateSession(token: string): void {
    if (sessionsCache.has(token)) {
      sessionsCache.delete(token);
      saveSessions();
    }
  }

  /**
   * Invalidate all sessions for a user (e.g. on password reset)
   */
  static invalidateAllUserSessions(userId: string): void {
    let changed = false;
    for (const [token, session] of sessionsCache.entries()) {
      if (session.userId === userId) {
        sessionsCache.delete(token);
        changed = true;
      }
    }
    if (changed) saveSessions();
  }

  /**
   * Register a new user with Email and Password
   */
  static register(params: {
    email: string;
    password: string;
    confirmPassword: string;
    name?: string;
  }): {
    success: boolean;
    error?: string;
    message?: string;
    user?: SanitizedUser;
    token?: string;
    verificationToken?: string;
    verificationLink?: string;
  } {
    const email = params.email.trim().toLowerCase();
    const password = params.password;
    const confirmPassword = params.confirmPassword;
    const rawName = params.name?.trim() || email.split('@')[0].replace(/[._]/g, ' ') || 'PakLingo User';
    const formattedName = rawName
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return { success: false, error: 'Please provide a valid email address.' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    if (password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match. Please re-enter your password.' };
    }

    // Check existing account
    const existing = Array.from(usersCache.values()).find((u) => u.email === email);
    if (existing) {
      if (!existing.passwordHash) {
        // Safe Account Linking: The user previously authenticated with Google and is now creating a separate PakLingo password.
        const { salt, hash } = this.hashPassword(password);
        existing.passwordHash = hash;
        existing.passwordSalt = salt;
        existing.updatedAt = new Date().toISOString();
        if (formattedName && (!existing.name || existing.name === 'User' || existing.name === 'PakLingo User')) {
          existing.name = formattedName;
        }
        usersCache.set(existing.id, existing);
        saveUsers();

        const { token } = this.createSession(existing.id);
        return {
          success: true,
          user: this.sanitizeUser(existing),
          token,
          message: 'PakLingo password created and linked to your account successfully.',
        };
      }
      return {
        success: false,
        error: 'An account with this email address already exists. Please sign in with your email and password.',
      };
    }

    // Hash password with cryptographically secure random salt
    const { salt, hash } = this.hashPassword(password);

    // Generate email verification token (24-hour expiry)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;

    const newUser: StoredUser = {
      id: 'usr_' + crypto.randomBytes(12).toString('hex'),
      email,
      name: formattedName,
      passwordHash: hash,
      passwordSalt: salt,
      provider: 'email',
      emailVerified: false,
      verificationToken,
      verificationTokenExpires,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    usersCache.set(newUser.id, newUser);
    saveUsers();

    // Issue active session
    const { token } = this.createSession(newUser.id);
    const verificationLink = `/verify-email?token=${verificationToken}`;

    return {
      success: true,
      user: this.sanitizeUser(newUser),
      token,
      verificationToken,
      verificationLink,
    };
  }

  /**
   * Authenticate user with Email and Password
   */
  static login(emailInput: string, passwordInput: string): {
    success: boolean;
    error?: string;
    user?: SanitizedUser;
    token?: string;
  } {
    const email = (emailInput || '').trim().toLowerCase();
    const password = passwordInput || '';

    if (!email || !password) {
      return { success: false, error: 'Please enter both your email and password.' };
    }

    const user = Array.from(usersCache.values()).find((u) => u.email === email);
    if (!user) {
      // Secure non-enumerating error message
      return { success: false, error: 'Incorrect email or password.' };
    }

    // If account was created without a password yet
    if (!user.passwordHash || !user.passwordSalt) {
      return {
        success: false,
        error: 'No password has been set for this account yet. Please continue with Google, or set a password using "Create Account" or "Forgot password?".',
      };
    }

    // Verify cryptographic hash
    const isValid = this.verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Incorrect email or password.' };
    }

    // Issue session token
    const { token } = this.createSession(user.id);
    return {
      success: true,
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Verify email address using token
   */
  static verifyEmail(token: string): { success: boolean; message?: string; error?: string } {
    if (!token || typeof token !== 'string') {
      return { success: false, error: 'Verification token is required.' };
    }

    const user = Array.from(usersCache.values()).find(
      (u) => u.verificationToken === token.trim()
    );

    if (!user) {
      return {
        success: false,
        error: 'The verification link is invalid. Please request a new verification email.',
      };
    }

    if (user.verificationTokenExpires && user.verificationTokenExpires < Date.now()) {
      return {
        success: false,
        error: 'This verification link has expired. Please request a new verification email.',
      };
    }

    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    user.updatedAt = new Date().toISOString();
    usersCache.set(user.id, user);
    saveUsers();

    return {
      success: true,
      message: 'Email address verified successfully! Your account is now fully verified.',
    };
  }

  /**
   * Resend verification email token
   */
  static resendVerification(emailInput: string): {
    success: boolean;
    error?: string;
    message?: string;
    verificationToken?: string;
    verificationLink?: string;
  } {
    const email = (emailInput || '').trim().toLowerCase();
    const user = Array.from(usersCache.values()).find((u) => u.email === email);

    if (!user) {
      // Safe enumeration protection
      return {
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      };
    }

    if (user.emailVerified) {
      return { success: true, message: 'This email address is already verified.' };
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    user.updatedAt = new Date().toISOString();
    usersCache.set(user.id, user);
    saveUsers();

    return {
      success: true,
      message: 'A fresh verification link has been sent to your email.',
      verificationToken,
      verificationLink: `/verify-email?token=${verificationToken}`,
    };
  }

  /**
   * Request password reset token
   */
  static requestPasswordReset(emailInput: string): {
    success: boolean;
    error?: string;
    message?: string;
    resetToken?: string;
    resetLink?: string;
  } {
    const email = (emailInput || '').trim().toLowerCase();
    const user = Array.from(usersCache.values()).find((u) => u.email === email);

    if (!user) {
      // Safe message for security
      return {
        success: true,
        message: 'If an account exists with this email, password reset instructions have been sent.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour expiry
    user.updatedAt = new Date().toISOString();
    usersCache.set(user.id, user);
    saveUsers();

    return {
      success: true,
      message: 'Password reset instructions have been sent to your email.',
      resetToken,
      resetLink: `/reset-password?token=${resetToken}`,
    };
  }

  /**
   * Reset password with valid reset token
   */
  static resetPassword(params: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): { success: boolean; error?: string; message?: string } {
    const { token, newPassword, confirmPassword } = params;

    if (!token || typeof token !== 'string') {
      return { success: false, error: 'Password reset token is required.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: 'Passwords do not match. Please verify.' };
    }

    const user = Array.from(usersCache.values()).find((u) => u.resetToken === token.trim());
    if (!user) {
      return {
        success: false,
        error: 'This password reset link is invalid. Please request a new reset link.',
      };
    }

    if (user.resetTokenExpires && user.resetTokenExpires < Date.now()) {
      return {
        success: false,
        error: 'This password reset link has expired. Please request a new link.',
      };
    }

    // Hash new password with fresh salt
    const { salt, hash } = this.hashPassword(newPassword);
    user.passwordHash = hash;
    user.passwordSalt = salt;
    user.resetToken = null;
    user.resetTokenExpires = null;
    user.updatedAt = new Date().toISOString();
    usersCache.set(user.id, user);
    saveUsers();

    // Invalidate existing sessions for security
    this.invalidateAllUserSessions(user.id);

    return {
      success: true,
      message: 'Your password has been securely reset. You can now sign in with your new password.',
    };
  }

  /**
   * Handle Google OAuth authentication
   * Safely links or creates user account without overwriting email password
   */
  static handleGoogleAuth(profile: {
    email: string;
    name: string;
    googleId?: string;
    avatar?: string;
  }): {
    success: boolean;
    error?: string;
    user?: SanitizedUser;
    token?: string;
  } {
    const email = (profile.email || '').trim().toLowerCase();
    if (!email) {
      return { success: false, error: 'Google account did not return a valid email address.' };
    }

    let user = Array.from(usersCache.values()).find((u) => u.email === email);

    if (user) {
      // Safe Account Linking:
      // If user already registered with email, link Google ID and update avatar/name safely.
      // NEVER remove or overwrite existing passwordHash!
      if (profile.googleId) user.googleId = profile.googleId;
      if (profile.avatar) user.avatar = profile.avatar;
      if (profile.name) user.name = profile.name;
      user.emailVerified = true; // Google verifies emails
      user.updatedAt = new Date().toISOString();
      usersCache.set(user.id, user);
      saveUsers();
    } else {
      // Create new Google user
      user = {
        id: profile.googleId || 'usr_g_' + crypto.randomBytes(12).toString('hex'),
        email,
        name: profile.name || email.split('@')[0],
        provider: 'google',
        googleId: profile.googleId,
        avatar: profile.avatar,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      usersCache.set(user.id, user);
      saveUsers();
    }

    const { token } = this.createSession(user.id);
    return {
      success: true,
      user: this.sanitizeUser(user),
      token,
    };
  }
}
