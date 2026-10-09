/**
 * PakLingo AI - Administrative Login Gateway
 * Authoritative, high-security administrator sign-in portal.
 */

import React, { useState } from 'react';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2, ArrowLeft, Key } from 'lucide-react';
import { useAdminAuth } from './context/AdminAuthContext';
import { motion } from 'motion/react';

export const AdminLogin: React.FC = () => {
  const { login, isLoading } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both administrative email and password.');
      return;
    }
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check administrator credentials.');
    }
  };

  const handleFillCredentials = (adminEmail: string) => {
    setEmail(adminEmail);
    setPassword('Admin@PakLingo2026!');
    setError(null);
  };

  return (
    <div
      id="admin-login-screen"
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-[var(--app-bg)] text-[var(--text-primary)] relative"
    >
      {/* Background Accent Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[var(--accent)]/10 blur-[130px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] shadow-md mb-3 text-[var(--accent)]">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Administrative Gateway
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xs mx-auto">
            PakLingo AI Enterprise Operations & Oversight System
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]">
            <Lock className="w-3 h-3 text-[var(--accent)]" />
            <span>Restricted Access • Server Authorized</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-7 shadow-xl">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email-input"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
              >
                Administrator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@paklingo.ai"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password-input"
                className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
              >
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  id="admin-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
                />
              </div>
            </div>

            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <span>Verifying Authorization...</span>
              ) : (
                <>
                  <span>Sign In as Administrator</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Helper */}
          <div className="mt-6 pt-5 border-t border-[var(--border)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Authorized Personnel
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">Click to autofill</span>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleFillCredentials('admin@paklingo.ai')}
                className="w-full text-left p-2.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-[var(--accent)] text-xs transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-medium text-[var(--text-primary)]">Principal Administrator</div>
                  <div className="text-[11px] text-[var(--text-secondary)] font-mono">admin@paklingo.ai</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                type="button"
                onClick={() => handleFillCredentials('emanparacha6024@gmail.com')}
                className="w-full text-left p-2.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-[var(--accent)] text-xs transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-medium text-[var(--text-primary)]">System Owner</div>
                  <div className="text-[11px] text-[var(--text-secondary)] font-mono">emanparacha6024@gmail.com</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                type="button"
                onClick={() => handleFillCredentials('emank20061@gmail.com')}
                className="w-full text-left p-2.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-[var(--accent)] text-xs transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-medium text-[var(--text-primary)]">System Owner</div>
                  <div className="text-[11px] text-[var(--text-secondary)] font-mono">emank20061@gmail.com</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </div>

        {/* Back to Public App */}
        <div className="text-center mt-5">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to User Public Interface</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
};
