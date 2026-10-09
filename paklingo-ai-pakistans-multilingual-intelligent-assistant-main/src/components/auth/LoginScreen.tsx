import React, { useState, useRef, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Globe2,
  ShieldCheck,
  Eye,
  EyeOff,
  Palette,
  Check,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Sparkles,
  Copy,
  ExternalLink,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme, THEMES_LIST } from '../../context/ThemeContext';
import { LanguageCode } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import {
  signInWithGooglePopup,
  signInWithGoogleRedirect,
  signInWithCredential,
  GoogleAuthProvider,
  linkWithCredential,
  checkRedirectResult,
  onAuthStateChanged,
  auth,
  firebaseConfigJson,
} from '../../lib/firebase';
import { syncUserProfileToFirestore } from '../../lib/firestoreService';

interface LoginScreenProps {
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onLoginSuccess: () => void;
  onClose?: () => void;
}

type AuthScreenView =
  | 'options'
  | 'email-signin'
  | 'email-signup'
  | 'forgot-password'
  | 'reset-password'
  | 'verify-email-pending';

export const LoginScreen: React.FC<LoginScreenProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onLoginSuccess,
  onClose,
}) => {
  const {
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    verifyEmail,
    resendVerification,
    requestPasswordReset,
    resetPassword,
    isLoading,
    user,
  } = useAuth();

  // If user is already authenticated or becomes authenticated via redirect/state-listener, trigger success
  useEffect(() => {
    if (user) {
      onLoginSuccess();
    }
  }, [user, onLoginSuccess]);

  const { theme, setTheme } = useTheme();

  // Current Screen State
  const [view, setView] = useState<AuthScreenView>('options');

  // Theme dropdown state
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot / Reset Password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Email Verification state
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [pendingVerificationToken, setPendingVerificationToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Feedback states
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [activeButton, setActiveButton] = useState<'google' | 'email' | 'reset' | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Close theme menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setIsThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check for Firebase Auth redirect result or URL parameters on mount
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlVerifyToken = urlParams.get('token') || urlParams.get('verifyToken');
      const isVerifyRoute = window.location.pathname.includes('verify-email');
      const isResetRoute = window.location.pathname.includes('reset-password');

      if (urlVerifyToken && isVerifyRoute) {
        setPendingVerificationToken(urlVerifyToken);
        setView('verify-email-pending');
        handleDirectEmailVerify(urlVerifyToken);
      } else if (urlVerifyToken && isResetRoute) {
        setResetToken(urlVerifyToken);
        setView('reset-password');
      }

      // Check if user just completed a Firebase redirect sign-in
      checkRedirectResult()
        .then(async (result) => {
          if (result && result.user) {
            const idToken = await result.user.getIdToken();
            await loginWithGoogle({
              idToken,
              profile: {
                email: result.user.email || '',
                name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
                avatar: result.user.photoURL || undefined,
                googleId: result.user.uid,
              },
            });
            syncUserProfileToFirestore(result.user.uid, {
              email: result.user.email || '',
              name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
              avatar: result.user.photoURL || undefined,
              provider: 'google',
              emailVerified: true,
            }).catch((e) => console.warn('Firestore sync note:', e));

            onLoginSuccess();
          }
        })
        .catch((err: any) => {
          console.warn('Firebase redirect result check error:', err);
          const raw = err?.message?.replace(/^Firebase:\s*(Error\s*)?(\(auth\/[^)]+\)\.?\s*)?/i, '') || '';
          if (raw && !raw.includes('null') && !raw.includes('cancelled')) {
            setAuthError(raw);
          }
        });
    } catch {}
  }, []);

  /**
   * 1. OFFICIAL GOOGLE SIGN-IN FLOW
   * Direct Firebase Authentication GoogleAuthProvider popup to display the official Google account chooser.
   */
  const handleGoogleClick = async () => {
    if (isLoading || activeButton === 'google') return;
    setAuthError(null);
    setAuthSuccess(null);
    setUnauthorizedDomain(null);
    setCopiedDomain(false);
    setActiveButton('google');

    let isHandled = false;

    // Helper to complete login once Firebase user is available
    const handleFirebaseSuccess = async (firebaseUser: any) => {
      if (isHandled) return;
      isHandled = true;

      try {
        const idToken = await firebaseUser.getIdToken();
        const profile = {
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          avatar: firebaseUser.photoURL || undefined,
          googleId: firebaseUser.uid,
        };
        await loginWithGoogle({
          idToken,
          profile,
        });
        // Sync profile to Firestore asynchronously
        syncUserProfileToFirestore(firebaseUser.uid, {
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
          provider: 'google',
          emailVerified: true,
        }).catch((e) => console.warn('Firestore sync background notice:', e));

        onLoginSuccess();
      } catch (err: any) {
        console.error('Session sync error:', err);
        setAuthError(err.message || 'Failed to initialize authenticated session.');
      } finally {
        setActiveButton(null);
      }
    };

    // Listen for Firebase Auth state in case background handshake completes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !isHandled) {
        unsubscribe();
        handleFirebaseSuccess(user);
      }
    });

    try {
      // 1. Primary: Official Firebase Google Sign-In with GoogleAuthProvider popup
      const credential = await signInWithGooglePopup();
      unsubscribe();
      if (credential && credential.user && !isHandled) {
        await handleFirebaseSuccess(credential.user);
      }
    } catch (firebaseErr: any) {
      unsubscribe();
      if (isHandled) return;
      setActiveButton(null);

      const code = firebaseErr?.code || '';
      const rawMessage = firebaseErr?.message || '';

      console.warn('Firebase Google Sign-In notice:', code, rawMessage);

      // User closed the popup window deliberately
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Google sign-in was cancelled.');
        return;
      }

      // Request cancelled or pending
      if (code === 'auth/cancelled-popup-request') {
        return;
      }

      // Automatic Fallback to signInWithRedirect if popup is blocked or unavailable
      const isPopupBlockedOrUnavailable =
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment' ||
        (code === 'auth/internal-error' && rawMessage.toLowerCase().includes('popup')) ||
        rawMessage.toLowerCase().includes('popup-blocked') ||
        rawMessage.toLowerCase().includes('popup was blocked') ||
        rawMessage.toLowerCase().includes('blocked');

      if (isPopupBlockedOrUnavailable) {
        try {
          console.info('Google popup blocked or unavailable. Falling back to signInWithRedirect...');
          setActiveButton('google');
          await signInWithGoogleRedirect();
          return;
        } catch (redirErr: any) {
          console.error('Redirect sign-in fallback error:', redirErr);
          setActiveButton(null);
          const rCode = redirErr?.code || '';
          if (rCode === 'auth/unauthorized-domain' || redirErr?.message?.includes('unauthorized-domain')) {
            const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
            setUnauthorizedDomain(currentHostname || 'ais-dev-rawwevzrxcfydh3ljyuekq-467280436057.asia-east1.run.app');
            setAuthError(
              currentHostname
                ? `Domain "${currentHostname}" is not authorized for Google Sign-In in Firebase.`
                : 'This domain is not authorized for Google Sign-In in Firebase.'
            );
            return;
          }
          setAuthError(
            'Google sign-in popup was blocked by your browser. Please allow popups or open in a new tab.'
          );
          return;
        }
      }

      if (code === 'auth/account-exists-with-different-credential') {
        const targetEmail = firebaseErr?.customData?.email || firebaseErr?.email;
        if (targetEmail) {
          setEmail(targetEmail);
        }
        setView('email-signin');
        setAuthError(
          'An account with this email was registered using email and password. Please sign in with your email and password.'
        );
        return;
      }

      if (code === 'auth/network-request-failed') {
        setAuthError(
          'Network connection error connecting to Google. Please check your internet connection and try again.'
        );
        return;
      }

      if (code === 'auth/unauthorized-domain' || rawMessage.includes('unauthorized-domain')) {
        const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
        setUnauthorizedDomain(currentHostname || 'ais-dev-rawwevzrxcfydh3ljyuekq-467280436057.asia-east1.run.app');
        setAuthError(
          currentHostname
            ? `Domain "${currentHostname}" is not authorized for Google Sign-In in Firebase.`
            : 'This domain is not authorized for Google Sign-In in Firebase.'
        );
        return;
      }

      // Clean display of any other error
      const cleaned = rawMessage
        .replace(/^Firebase:\s*(Error\s*)?(\(auth\/[^)]+\)\.?\s*)?/i, '')
        .trim();
      setAuthError(cleaned || 'Google authentication failed. Please try again.');
    }
  };

  /**
   * 2. EMAIL SIGN IN
   * Validates credentials against securely stored cryptographic hash
   */
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setAuthError(null);
    setAuthSuccess(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setAuthError('Please enter both your email address and password.');
      return;
    }

    setActiveButton('email');
    try {
      await loginWithEmail(cleanEmail, password);

      // If there was a pending Google credential from an attempted Google sign in, link it now
      const pendingCred = (window as any).__pendingGoogleCredential;
      if (pendingCred && auth.currentUser) {
        try {
          await linkWithCredential(auth.currentUser, pendingCred);
          (window as any).__pendingGoogleCredential = null;
        } catch (linkErr) {
          console.warn('Account linking note:', linkErr);
        }
      }

      onLoginSuccess();
    } catch (err: any) {
      // Return clear secure non-enumerating error
      setAuthError(err.message || 'Incorrect email or password.');
    } finally {
      setActiveButton(null);
    }
  };

  /**
   * 3. EMAIL REGISTRATION (CREATE ACCOUNT)
   * Hashes password on backend, stores salt, generates verification link
   */
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setAuthError(null);
    setAuthSuccess(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match. Please verify both password fields.');
      return;
    }

    setActiveButton('email');
    try {
      const result = await registerWithEmail(cleanEmail, password, confirmPassword, fullName);
      if (result.verificationToken) {
        setPendingVerificationEmail(cleanEmail);
        setPendingVerificationToken(result.verificationToken);
        setAuthSuccess('Account created successfully! A verification email has been sent.');
        setView('verify-email-pending');
      } else {
        setAuthSuccess('PakLingo password created and linked to your account successfully!');
        setTimeout(() => {
          onLoginSuccess();
        }, 800);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to create account. Please check your details.');
    } finally {
      setActiveButton(null);
    }
  };

  /**
   * 4. DIRECT EMAIL VERIFICATION ACTION
   */
  const handleDirectEmailVerify = async (tokenToVerify?: string) => {
    const tok = tokenToVerify || pendingVerificationToken;
    if (!tok) {
      setAuthError('No verification token provided.');
      return;
    }

    setIsVerifying(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const result = await verifyEmail(tok);
      if (result.success) {
        setAuthSuccess('Your email address has been successfully verified!');
        setTimeout(() => {
          onLoginSuccess();
        }, 1200);
      } else {
        setAuthError(result.error || 'Verification link is invalid or expired.');
      }
    } catch {
      setAuthError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * 5. RESEND VERIFICATION EMAIL
   */
  const handleResendVerification = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const result = await resendVerification(pendingVerificationEmail || email);
      if (result.success) {
        if (result.verificationLink) {
          const match = result.verificationLink.match(/token=([a-f0-9]+)/);
          if (match) setPendingVerificationToken(match[1]);
        }
        setAuthSuccess('A fresh verification link has been sent to your email.');
      } else {
        setAuthError(result.error || 'Failed to resend verification.');
      }
    } catch {
      setAuthError('Error sending verification email.');
    }
  };

  /**
   * 6. REQUEST PASSWORD RESET (FORGOT PASSWORD)
   */
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const cleanEmail = forgotEmail.trim();
    if (!cleanEmail) {
      setAuthError('Please enter your registered email address.');
      return;
    }

    setActiveButton('reset');
    try {
      const res = await requestPasswordReset(cleanEmail);
      if (res.success) {
        setAuthSuccess(res.message || 'Password reset instructions sent to your email.');
        if (res.resetToken) {
          setResetToken(res.resetToken);
        }
      } else {
        setAuthError(res.error || 'Failed to process password reset.');
      }
    } catch {
      setAuthError('Failed to send password reset. Please try again.');
    } finally {
      setActiveButton(null);
    }
  };

  /**
   * 7. COMPLETE PASSWORD RESET
   */
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!resetToken) {
      setAuthError('Missing password reset token.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setAuthError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setAuthError('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    setActiveButton('reset');
    try {
      const res = await resetPassword(resetToken, newPassword, confirmNewPassword);
      if (res.success) {
        setAuthSuccess(res.message || 'Password has been securely reset. You can now sign in.');
        setEmail(forgotEmail || email);
        setPassword('');
        setView('email-signin');
      } else {
        setAuthError(res.error || 'Password reset link is invalid or expired.');
      }
    } catch {
      setAuthError('Failed to reset password. Please try again.');
    } finally {
      setActiveButton(null);
    }
  };

  return (
    <div
      id="paklingo-login-screen"
      className="min-h-screen w-full bg-[var(--background)] text-[var(--text-primary)] flex flex-col justify-between relative selection:bg-[var(--accent)] selection:text-white"
    >
      {/* Top Header Bar: Logo, Theme Switcher & Language Selector */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] flex items-center justify-center shadow-md border border-[var(--border)]">
            <span className="font-bold text-lg font-serif">P</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-[var(--text-primary)]">
                PakLingo
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-[var(--accent)]/15 text-[var(--accent)] font-bold border border-[var(--accent)]/30 uppercase tracking-wider">
                AI
              </span>
            </div>
            <span className="text-[11px] font-urdu text-[var(--accent)]">
              پاکستان کا کثیر لسانی اے آئی معاون
            </span>
          </div>
        </div>

        {/* Right Side Header Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Theme Selector */}
          <div className="relative" ref={themeRef}>
            <button
              type="button"
              id="login-theme-toggle"
              onClick={() => setIsThemeOpen(!isThemeOpen)}
              className="flex items-center gap-1.5 bg-[var(--surface)] hover:bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-xs transition-colors cursor-pointer"
              title={`Active Theme: ${theme}`}
              aria-label="Select Theme"
            >
              <Palette className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
              <span className="hidden sm:inline capitalize font-medium">{theme}</span>
            </button>

            {isThemeOpen && (
              <div
                id="login-theme-menu"
                className="absolute right-0 mt-2 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl p-1.5 z-50 space-y-0.5"
              >
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider border-b border-[var(--border)] mb-1">
                  Website Theme
                </div>
                {THEMES_LIST.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTheme(t.id);
                      setIsThemeOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      theme === t.id
                        ? 'bg-[var(--surface-secondary)] text-[var(--accent)] font-bold'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: t.accentPreview }}
                      />
                      <span>{t.name}</span>
                    </div>
                    {theme === t.id && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Multilingual Selector */}
          <div className="flex items-center gap-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-secondary)] shadow-xs">
            <Globe2 className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
            <select
              id="login-language-select"
              value={selectedLanguage}
              onChange={(e) => onSelectLanguage(e.target.value as LanguageCode)}
              className="bg-transparent text-xs text-[var(--text-primary)] focus:outline-hidden cursor-pointer font-medium"
              aria-label="Select Interface Language"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option
                  key={lang.code}
                  value={lang.code}
                  className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]"
                >
                  {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>

          {/* Close Button when displayed as modal overlay */}
          {onClose && (
            <button
              type="button"
              id="login-close-btn"
              onClick={onClose}
              className="flex items-center gap-1 bg-[var(--surface)] hover:bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-xs transition-colors cursor-pointer active:scale-95 ml-1"
              title="Close and return to app"
              aria-label="Close login dialog"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Close</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Centered Login Section (NO white card container, NO character, NO animation) */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 sm:px-6 flex flex-col items-center justify-center py-8 sm:py-12">
        <div className="w-full text-center space-y-6">
          {/* Centered Brand Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] shadow-md border border-[var(--border)] mb-1">
              <span className="font-bold text-2xl font-serif">P</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
                PakLingo
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-[var(--accent)]/15 text-[var(--accent)] font-bold border border-[var(--accent)]/30 uppercase tracking-wider">
                AI
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Welcome Back 👋
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Sign in to continue to PakLingo AI
            </p>
          </div>

          {/* Unauthorized Domain Guide Panel */}
          {unauthorizedDomain && (
            <div
              id="unauthorized-domain-guide"
              className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-100 space-y-3 text-left"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs text-amber-950 dark:text-amber-50">
                    Firebase Authorized Domain Required
                  </h4>
                  <p className="text-[11px] text-amber-800 dark:text-amber-200 mt-0.5 leading-relaxed">
                    Firebase Authentication requires your current preview domain to be added to Authorized Domains for project <span className="font-mono font-semibold">{firebaseConfigJson.projectId}</span>.
                  </p>
                </div>
              </div>

              <div className="bg-[var(--surface)] p-2.5 rounded-lg border border-amber-500/20 flex items-center justify-between gap-2">
                <code className="text-[11px] font-mono text-[var(--text-primary)] truncate select-all">
                  {unauthorizedDomain}
                </code>
                <button
                  type="button"
                  id="copy-preview-domain-btn"
                  onClick={() => {
                    if (navigator?.clipboard?.writeText) {
                      navigator.clipboard.writeText(unauthorizedDomain);
                      setCopiedDomain(true);
                      setTimeout(() => setCopiedDomain(false), 2500);
                    }
                  }}
                  className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 font-medium text-[11px] shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedDomain ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Domain</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <a
                  href={`https://console.firebase.google.com/project/${firebaseConfigJson.projectId}/authentication/settings`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white font-medium text-[11px] hover:bg-amber-600 transition-colors shadow-xs"
                >
                  <span>Open Firebase Settings</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-[10px] text-amber-800/80 dark:text-amber-200/80">
                  Add domain → Click Save → Click Continue with Google
                </span>
              </div>
            </div>
          )}

          {/* Error Message Notification */}
          {authError && !unauthorizedDomain && (
            <div
              id="auth-error-banner"
              className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-300 flex items-start justify-start gap-2.5 text-left"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{authError}</span>
            </div>
          )}

          {/* Success Notification */}
          {authSuccess && (
            <div
              id="auth-success-banner"
              className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-300 flex items-start justify-start gap-2.5 text-left"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{authSuccess}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 1: OPTIONS (Continue with Google OR Continue with Email) */}
          {/* ======================================================== */}
          {view === 'options' && (
            <div className="space-y-4 pt-1">
              {/* Continue with Google Button */}
              <button
                type="button"
                id="continue-with-google-btn"
                onClick={handleGoogleClick}
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] font-semibold text-sm flex items-center justify-center gap-3 transition-colors shadow-xs cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {activeButton === 'google' ? (
                  <>
                    <Loader2 className="w-4 h-4 text-[var(--text-secondary)] animate-spin" />
                    <span>Connecting to Google OAuth...</span>
                  </>
                ) : (
                  <>
                    {/* Official Google G Logo */}
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.24 21.35 7.32 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.32 0 3.24 2.65 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Clean Centered OR Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="w-full border-t border-[var(--border)]" />
                <span className="bg-[var(--background)] px-3 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
                  OR
                </span>
              </div>

              {/* Continue with Email Button */}
              <button
                type="button"
                id="continue-with-email-btn"
                onClick={() => {
                  setAuthError(null);
                  setAuthSuccess(null);
                  setView('email-signin');
                }}
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-[var(--button-primary-bg)] hover:opacity-90 active:scale-[0.99] text-[var(--button-primary-text)] font-semibold text-sm flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Mail className="w-4 h-4" />
                <span>Continue with Email</span>
              </button>

              {/* Centered Sign In / Sign Up Footer Links */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-xs text-[var(--text-muted)]">
                <button
                  type="button"
                  id="link-to-signin"
                  onClick={() => {
                    setAuthError(null);
                    setAuthSuccess(null);
                    setView('email-signin');
                  }}
                  className="hover:text-[var(--accent)] transition-colors cursor-pointer"
                >
                  Already have an account?{' '}
                  <span className="text-[var(--accent)] font-semibold underline underline-offset-2">
                    Sign in
                  </span>
                </button>
                <span className="hidden sm:inline text-[var(--border)]">•</span>
                <button
                  type="button"
                  id="link-to-signup"
                  onClick={() => {
                    setAuthError(null);
                    setAuthSuccess(null);
                    setView('email-signup');
                  }}
                  className="hover:text-[var(--accent)] transition-colors cursor-pointer"
                >
                  New here?{' '}
                  <span className="text-[var(--accent)] font-semibold underline underline-offset-2">
                    Create an account
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: EMAIL SIGN IN (Email + Password) */}
          {/* ======================================================== */}
          {view === 'email-signin' && (
            <form onSubmit={handleEmailSignIn} className="space-y-4 text-left pt-1">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  Sign In with Email
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setAuthSuccess(null);
                    setView('options');
                  }}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  ← Back to options
                </button>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    id="email-input"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </div>

              {/* Password & Forgot Password Link */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Password
                  </label>
                  <button
                    type="button"
                    id="forgot-password-link"
                    onClick={() => {
                      setAuthError(null);
                      setAuthSuccess(null);
                      setForgotEmail(email);
                      setView('forgot-password');
                    }}
                    className="text-xs text-[var(--accent)] hover:underline cursor-pointer font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password-input"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="email-auth-submit-btn"
                disabled={isLoading}
                className="w-full h-11 mt-2 rounded-xl bg-[var(--button-primary-bg)] hover:opacity-90 active:scale-[0.99] text-[var(--button-primary-text)] font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {activeButton === 'email' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to PakLingo AI</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Switch to Sign Up */}
              <div className="pt-2 text-center text-xs text-[var(--text-muted)]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setAuthSuccess(null);
                    setView('email-signup');
                  }}
                  className="hover:text-[var(--accent)] transition-colors cursor-pointer"
                >
                  New to PakLingo AI?{' '}
                  <span className="text-[var(--accent)] font-semibold underline underline-offset-2">
                    Create an account
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* VIEW 3: CREATE ACCOUNT (Email + Password + Confirm Password) */}
          {/* ======================================================== */}
          {view === 'email-signup' && (
            <form onSubmit={handleEmailSignUp} className="space-y-4 text-left pt-1">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] block">
                    Create Account
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Create a password specifically for your PakLingo AI account
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setAuthSuccess(null);
                    setView('options');
                  }}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0 ml-2"
                >
                  ← Back
                </button>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="signup-name-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Tariq Khan"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    id="signup-email-input"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Password
                  </label>
                  <span className="text-[11px] text-[var(--text-muted)]">Min. 6 characters</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="signup-password-input"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="signup-confirm-password-input"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-[var(--text-muted)] leading-normal">
                🔒 Note: This password is created specifically for your PakLingo AI account. It is
                never shared with Google or third parties and is cryptographically hashed.
              </p>

              {/* Submit Button */}
              <button
                type="submit"
                id="signup-submit-btn"
                disabled={isLoading}
                className="w-full h-11 mt-2 rounded-xl bg-[var(--button-primary-bg)] hover:opacity-90 active:scale-[0.99] text-[var(--button-primary-text)] font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {activeButton === 'email' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account securely...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Switch to Sign In */}
              <div className="pt-2 text-center text-xs text-[var(--text-muted)]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setAuthSuccess(null);
                    setView('email-signin');
                  }}
                  className="hover:text-[var(--accent)] transition-colors cursor-pointer"
                >
                  Already have an account?{' '}
                  <span className="text-[var(--accent)] font-semibold underline underline-offset-2">
                    Sign in
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* VIEW 4: FORGOT PASSWORD */}
          {/* ======================================================== */}
          {view === 'forgot-password' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-left pt-1">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  Reset Password
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setAuthSuccess(null);
                    setView('email-signin');
                  }}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  ← Back to sign in
                </button>
              </div>

              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Enter your PakLingo AI account email. We will send you a secure link to create a new
                password.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    id="forgot-email-input"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="forgot-password-submit-btn"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-[var(--button-primary-bg)] hover:opacity-90 active:scale-[0.99] text-[var(--button-primary-text)] font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {activeButton === 'reset' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending reset instructions...</span>
                  </>
                ) : (
                  <>
                    <span>Send Password Reset Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* If reset token was generated, allow immediate transition to set new password */}
              {resetToken && (
                <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2 text-center">
                  <span className="text-xs text-[var(--text-secondary)] block">
                    Password reset link ready for testing:
                  </span>
                  <button
                    type="button"
                    onClick={() => setView('reset-password')}
                    className="w-full py-2 px-3 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Proceed to Set New Password</span>
                  </button>
                </div>
              )}
            </form>
          )}

          {/* ======================================================== */}
          {/* VIEW 5: RESET PASSWORD (NEW PASSWORD + CONFIRM NEW PASSWORD) */}
          {/* ======================================================== */}
          {view === 'reset-password' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-left pt-1">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                  Create New Password
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setAuthSuccess(null);
                    setView('email-signin');
                  }}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Choose a new secure password for your PakLingo AI account.
              </p>

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="new-password-input"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    id="confirm-new-password-input"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="reset-password-submit-btn"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-[var(--button-primary-bg)] hover:opacity-90 active:scale-[0.99] text-[var(--button-primary-text)] font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {activeButton === 'reset' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <span>Update Password & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* VIEW 6: EMAIL VERIFICATION PENDING */}
          {/* ======================================================== */}
          {view === 'verify-email-pending' && (
            <div className="space-y-4 text-left pt-1">
              <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Verify Your Email Address
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  We sent a verification email to{' '}
                  <strong className="text-[var(--text-primary)] font-semibold">
                    {pendingVerificationEmail || email || 'your email'}
                  </strong>
                  . Please verify your email address to complete your account setup.
                </p>

                {/* Direct 1-Click Verification in Preview */}
                <button
                  type="button"
                  id="direct-verify-email-btn"
                  onClick={() => handleDirectEmailVerify()}
                  disabled={isVerifying}
                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying account...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Verify Email Now</span>
                    </>
                  )}
                </button>

                {/* Resend Verification */}
                <div className="flex items-center justify-center gap-2 pt-1 text-xs">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend verification email</span>
                  </button>
                </div>
              </div>

              {/* Continue to app anyway (with unverified banner in app) */}
              <button
                type="button"
                onClick={onLoginSuccess}
                className="w-full py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-xs font-semibold text-[var(--text-primary)] text-center cursor-pointer transition-colors"
              >
                Continue to PakLingo AI (Verify later)
              </button>
            </div>
          )}

          {/* Verified SSL Badge */}
          <div className="pt-3 flex items-center justify-center">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
              <span>Verified & Secure Cryptographic Authentication</span>
            </div>
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[var(--border)] text-[var(--text-muted)] text-[11px]">
        <p>© 2026 PakLingo AI. Empowering Pakistan with multilingual AI technology.</p>
        <div className="flex items-center gap-4">
          <span>Urdu • Punjabi • Sindhi • Pashto • Balochi</span>
          <span>•</span>
          <span className="text-[var(--accent)]">Privacy & Terms</span>
        </div>
      </footer>
    </div>
  );
};
