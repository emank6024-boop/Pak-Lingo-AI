/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PageId, LanguageCode, AccessibilitySettings } from './types';
import { Navbar } from './components/Navbar';
import { ModuleSubNav } from './components/ModuleSubNav';
import { Home } from './components/pages/Home';
import { AIAssistant } from './components/pages/AIAssistant';
import { GovernmentAssistant } from './components/pages/GovernmentAssistant';
import { AITeacher } from './components/pages/AITeacher';
import { MedicalAssistant } from './components/pages/MedicalAssistant';
import { FarmerAssistant } from './components/pages/FarmerAssistant';
import { LegalAssistant } from './components/pages/LegalAssistant';
import { FakeNewsDetector } from './components/pages/FakeNewsDetector';
import { OCRDocumentIntelligence } from './components/pages/OCRDocumentIntelligence';
import { LiveTranslator } from './components/pages/LiveTranslator';
import { SignLanguageAssistant } from './components/pages/SignLanguageAssistant';
import { VoiceAssistant } from './components/pages/VoiceAssistant';
import { Dashboard } from './components/pages/Dashboard';
import { Settings } from './components/pages/Settings';
import { ToolsPage } from './components/pages/ToolsPage';
import { HistoryPage } from './components/pages/HistoryPage';
import { VoiceSettingsProvider } from './context/VoiceSettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { AdminApp } from './admin/AdminApp';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, X, AlertCircle, RefreshCw, Clock, Lock, LogIn } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, resendVerification } = useAuth();
  const { selectedLanguage, setSelectedLanguage, isRTL } = useLanguage();
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [dismissVerifyBanner, setDismissVerifyBanner] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [initialAssistantPrompt, setInitialAssistantPrompt] = useState<string | undefined>(undefined);

  // Modal Auth State: opens LoginScreen as an overlay without forcing early return
  const [intendedPage, setIntendedPage] = useState<PageId | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const search = window.location.search;
    const pathname = window.location.pathname;
    return (
      search.includes('token=') ||
      search.includes('verifyToken=') ||
      pathname.includes('verify-email') ||
      pathname.includes('reset-password')
    );
  });

  // Pages that genuinely require authenticated account context
  const PROTECTED_PAGES: PageId[] = ['history', 'dashboard'];

  const handleSelectPage = (targetPage: PageId) => {
    if (PROTECTED_PAGES.includes(targetPage) && !isAuthenticated) {
      setIntendedPage(targetPage);
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentPage(targetPage);
  };

  const handleLoginSuccess = () => {
    setIsAuthModalOpen(false);
    if (intendedPage) {
      setCurrentPage(intendedPage);
      setIntendedPage(null);
    }
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
    setIntendedPage(null);
  };

  // Keyboard accessibility: dismiss auth modal on Escape
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen]);

  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    highContrast: false,
    simpleMode: false,
    fontSize: 'md',
    screenReaderMode: false,
    reducedMotion: false,
    voiceFeedback: true,
    speechRate: 1.0,
    theme: 'dark',
  });

  const handleUpdateAccessibility = (settings: Partial<AccessibilitySettings>) => {
    setAccessibility((prev) => ({ ...prev, ...settings }));
  };

  const handleStartChatWithPrompt = (prompt: string) => {
    setInitialAssistantPrompt(prompt);
    setCurrentPage('ai-assistant');
  };

  const handleScrollToSection = (sectionId: string) => {
    if (currentPage !== 'home') {
      setCurrentPage('home');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Scroll to top on page change if not jumping to section
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Synchronize document dir and lang with selected language for proper Urdu RTL support
  useEffect(() => {
    document.documentElement.lang = selectedLanguage;
    document.documentElement.dir = selectedLanguage === 'ur' ? 'rtl' : 'ltr';
  }, [selectedLanguage]);

  // Handle font size class
  const fontSizeClass =
    accessibility.fontSize === 'xl'
      ? 'text-lg'
      : accessibility.fontSize === 'lg'
      ? 'text-base'
      : accessibility.fontSize === 'sm'
      ? 'text-xs'
      : 'text-sm';

  const isHome = currentPage === 'home';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 bg-[var(--app-bg)] text-[var(--text-primary)] ${fontSizeClass}`}
    >
      {/* Universal Sticky Navbar */}
      <Navbar
        currentPage={currentPage}
        onSelectPage={handleSelectPage}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Unverified Email Alert Banner (Only shown for non-Google authenticated accounts needing email confirmation) */}
      {user && user.provider !== 'google' && !user.emailVerified && !dismissVerifyBanner && user.email && (
        <div
          id="email-verification-banner"
          className="bg-[var(--surface-secondary)] border-b border-[var(--border)] px-4 py-2.5 text-xs text-[var(--text-primary)] flex flex-wrap items-center justify-between gap-3 transition-colors shadow-xs"
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="w-6 h-6 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center shrink-0">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 text-[12px] leading-snug">
              <span className="text-[var(--text-secondary)]">
                Email verification required for <strong className="text-[var(--text-primary)] font-semibold">{user.email}</strong>. Please check your inbox.
              </span>
              {verifyNotice && (
                <span className="ml-2 font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[11px]">
                  {verifyNotice}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="resend-verification-btn"
              type="button"
              onClick={async () => {
                setIsResending(true);
                const res = await resendVerification(user.email);
                setIsResending(false);
                setVerifyNotice(res.message || 'Verification link resent.');
              }}
              disabled={isResending}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin text-[var(--accent)]' : ''}`} />
              <span>{isResending ? 'Sending...' : 'Resend Link'}</span>
            </button>
            <button
              id="dismiss-verification-btn"
              type="button"
              onClick={() => setDismissVerifyBanner(true)}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Dismiss banner"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Sub-Navigation breadcrumbs when viewing inner specialized sub-tools */}
      <ModuleSubNav
        currentPage={currentPage}
        onSelectPage={handleSelectPage}
      />

      {/* Main Content Area */}
      <main
        id="main-app-content"
        role="main"
        className={`flex-1 w-full ${isHome ? '' : 'max-w-7xl mx-auto p-4 sm:p-6 lg:p-8'}`}
      >
        {currentPage === 'home' && (
          <Home
            onSelectPage={handleSelectPage}
            selectedLanguage={selectedLanguage}
            onSelectLanguage={setSelectedLanguage}
            onStartChatWithPrompt={handleStartChatWithPrompt}
            simpleMode={accessibility.simpleMode}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {(currentPage === 'translate' || currentPage === 'translator') && (
          <LiveTranslator selectedLanguage={selectedLanguage} />
        )}

        {(currentPage === 'chat' || currentPage === 'ai-assistant') && (
          <AIAssistant
            selectedLanguage={selectedLanguage}
            onSelectLanguage={setSelectedLanguage}
            initialPrompt={initialAssistantPrompt}
          />
        )}

        {currentPage === 'tools' && (
          <ToolsPage onSelectPage={handleSelectPage} />
        )}

        {(currentPage === 'documents' || currentPage === 'ocr-documents' || (currentPage as string) === 'ocr') && (
          <OCRDocumentIntelligence selectedLanguage={selectedLanguage} />
        )}

        {(currentPage === 'history' || currentPage === 'dashboard') && (
          isAuthenticated ? (
            <HistoryPage onSelectPage={handleSelectPage} />
          ) : (
            <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Clock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                {isRTL ? 'لاگ ان درکار ہے' : 'Sign In Required'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {isRTL
                  ? 'آپ کی سابقہ گفتگو، محفوظ شدہ ترجمے اور ریکارڈز صرف لاگ ان صارفین کے لیے دستیاب ہیں۔ براہ کرم اپنا اکاؤنٹ لاگ ان کریں۔'
                  : 'Your activity history, recent chats, and translations are securely stored with your account. Sign in or create a free account to view your history.'}
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  id="protected-history-login-btn"
                  onClick={() => {
                    setIntendedPage('history');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  {isRTL ? 'لاگ ان / اکاؤنٹ بنائیں' : 'Sign In / Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage('home')}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-xs font-medium hover:bg-[var(--surface-hover)] active:scale-95 transition-all cursor-pointer"
                >
                  {isRTL ? 'ہوم پیج پر واپس جائیں' : 'Return to Home'}
                </button>
              </div>
            </div>
          )
        )}

        {currentPage === 'government' && (
          <GovernmentAssistant selectedLanguage={selectedLanguage} />
        )}

        {currentPage === 'teacher' && (
          <AITeacher selectedLanguage={selectedLanguage} />
        )}

        {currentPage === 'medical' && (
          <MedicalAssistant selectedLanguage={selectedLanguage} />
        )}

        {currentPage === 'farmer' && (
          <FarmerAssistant selectedLanguage={selectedLanguage} />
        )}

        {currentPage === 'legal' && (
          <LegalAssistant selectedLanguage={selectedLanguage} />
        )}

        {currentPage === 'fake-news' && (
          <FakeNewsDetector selectedLanguage={selectedLanguage} />
        )}

        {currentPage === 'sign-language' && (
          <SignLanguageAssistant selectedLanguage={selectedLanguage} />
        )}

        {currentPage === 'voice-assistant' && (
          <VoiceAssistant selectedLanguage={selectedLanguage} />
        )}

        {currentPage === 'settings' && (
          <Settings
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            highContrast={accessibility.highContrast}
            onToggleHighContrast={() =>
              handleUpdateAccessibility({ highContrast: !accessibility.highContrast })
            }
            simpleMode={accessibility.simpleMode}
            onToggleSimpleMode={() =>
              handleUpdateAccessibility({ simpleMode: !accessibility.simpleMode })
            }
          />
        )}
      </main>

      {/* Global Voice Settings Modal */}
      <VoiceSettingsModal />

      {/* Auth Modal Overlay: displays LoginScreen when user opts in */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-[var(--background)] selection:bg-[var(--accent)] selection:text-white"
            role="dialog"
            aria-modal="true"
            aria-label="Account Authentication"
          >
            <LoginScreen
              selectedLanguage={selectedLanguage}
              onSelectLanguage={setSelectedLanguage}
              onClose={handleCloseAuthModal}
              onLoginSuccess={handleLoginSuccess}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function isCurrentAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return (
    path.startsWith('/admin') ||
    search.includes('admin=true') ||
    hash.startsWith('#/admin') ||
    hash.startsWith('#admin')
  );
}

export default function App() {
  const [isAdmin, setIsAdmin] = useState(isCurrentAdminRoute);

  useEffect(() => {
    const handleRouteChange = () => {
      setIsAdmin(isCurrentAdminRoute());
    };

    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  if (isAdmin) {
    return (
      <ThemeProvider>
        <AdminApp />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <VoiceSettingsProvider>
        <AuthProvider>
          <LanguageProvider>
            <AppContent />
          </LanguageProvider>
        </AuthProvider>
      </VoiceSettingsProvider>
    </ThemeProvider>
  );
}
