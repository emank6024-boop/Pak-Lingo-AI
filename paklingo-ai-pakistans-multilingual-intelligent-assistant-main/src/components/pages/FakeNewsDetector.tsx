import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Link2,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileSearch,
  Info,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Loader2,
  RefreshCw,
  X,
  FileQuestion,
  Check,
} from 'lucide-react';
import { FAKE_NEWS_SAMPLES } from '../../data/mockData';
import { LanguageCode } from '../../types';
import { useMultilingualTTS } from '../../hooks/useMultilingualTTS';
import { SpeechPlayerControls } from '../SpeechPlayerControls';
import { FormattedMarkdown } from '../FormattedMarkdown';

interface FakeNewsDetectorProps {
  selectedLanguage: LanguageCode;
}

interface FactCheckResult {
  verdict: string;
  credibilityScore: number;
  summary: string;
  evidence: string[];
  redFlags: string[];
  recommendedAction: string;
  officialSource?: string;
}

export const FakeNewsDetector: React.FC<FakeNewsDetectorProps> = ({ selectedLanguage }) => {
  const tts = useMultilingualTTS();
  const [newsText, setNewsText] = useState(FAKE_NEWS_SAMPLES[0].text);
  const [newsUrl, setNewsUrl] = useState('https://bit.ly/gov-grant-2026-verify');
  const [uploadedScreenshot, setUploadedScreenshot] = useState<{
    file: File;
    previewUrl?: string;
    base64?: string;
    mimeType: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FactCheckResult | null>({
    verdict: FAKE_NEWS_SAMPLES[0].verdict,
    credibilityScore: FAKE_NEWS_SAMPLES[0].credibilityScore,
    summary: 'Viral WhatsApp forward circulating regarding an urgent BISP grant asking recipients to submit CNIC details to an unverified third-party shortlink.',
    evidence: FAKE_NEWS_SAMPLES[0].evidence,
    redFlags: FAKE_NEWS_SAMPLES[0].redFlags,
    recommendedAction: FAKE_NEWS_SAMPLES[0].recommendedAction,
    officialSource: 'BISP Official Helpline 0800-26477 or bisp.gov.pk',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<(() => void) | null>(null);

  const handleImageSelect = (file: File) => {
    const isImg = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedScreenshot({
        file,
        previewUrl: isImg ? URL.createObjectURL(file) : undefined,
        base64: reader.result as string,
        mimeType: file.type || 'image/jpeg',
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    if (uploadedScreenshot?.previewUrl) {
      URL.revokeObjectURL(uploadedScreenshot.previewUrl);
    }
    setUploadedScreenshot(null);
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newsText.trim() && !newsUrl.trim() && !uploadedScreenshot) return;

    setIsAnalyzing(true);
    setErrorMessage(null);
    setLastAction(() => () => handleAnalyze());

    try {
      const res = await fetch('/api/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim: newsText,
          sourceUrl: newsUrl,
          imageBase64: uploadedScreenshot?.base64,
          mimeType: uploadedScreenshot?.mimeType,
          language: selectedLanguage,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server returned error status ${res.status}`);
      }

      const data = await res.json();
      const score =
        typeof data.credibilityScore === 'number'
          ? data.credibilityScore
          : typeof data.confidence === 'number'
          ? data.verdict === 'VERIFIED_TRUE'
            ? data.confidence
            : Math.max(10, 100 - data.confidence)
          : 50;

      setAnalysisResult({
        verdict: data.verdict || 'Analysis Completed',
        credibilityScore: score,
        summary: data.summary || 'Fact-check breakdown generated.',
        evidence: Array.isArray(data.evidence) && data.evidence.length > 0 ? data.evidence : ['No specific evidence points recorded.'],
        redFlags: Array.isArray(data.redFlags) && data.redFlags.length > 0 ? data.redFlags : ['None observed.'],
        recommendedAction: data.recommendedAction || data.verificationAdvice || 'Cross-check with verified government or media sources before sharing.',
        officialSource: data.officialSource || 'Official Government of Pakistan portal',
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification service encountered an error. Please retry.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectSample = (sample: typeof FAKE_NEWS_SAMPLES[0]) => {
    setNewsText(sample.text);
    setNewsUrl('');
    setUploadedScreenshot(null);
    setAnalysisResult({
      verdict: sample.verdict,
      credibilityScore: sample.credibilityScore,
      summary: `Pre-compiled verification case: ${sample.verdict}`,
      evidence: sample.evidence,
      redFlags: sample.redFlags,
      recommendedAction: sample.recommendedAction,
      officialSource: 'Verified fact-check registry',
    });
  };

  const isVerified = analysisResult && analysisResult.credibilityScore > 70;
  const isSuspicious = analysisResult && analysisResult.credibilityScore > 30 && analysisResult.credibilityScore <= 70;
  const isFalse = analysisResult && analysisResult.credibilityScore <= 30;

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
          Misinformation & Hoax Verification
        </h1>
        <p className="text-[var(--text-muted)] text-xs sm:text-sm">
          AI credibility analysis, circular spoofing detection, and viral claim fact-checking for Pakistan.
        </p>
      </div>

      {/* Mandatory Transparency Notice */}
      <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-[var(--text-primary)]">Public Verification Advisory</p>
          <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
            PakLingo AI evaluates linguistic manipulation cues, impersonation vectors, and official press records. Always cross-verify critical administrative circulars via official gov.pk channels.
          </p>
        </div>
      </div>

      {/* Error Notice with Retry */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Fact-Check Service Issue</span>
          </div>
          <p className="text-xs leading-relaxed">{errorMessage}</p>
          {lastAction && (
            <button
              type="button"
              onClick={lastAction}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:opacity-90 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>Retry Fact-Check</span>
            </button>
          )}
        </div>
      )}

      {/* Input Form Card */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 sm:p-6 space-y-4 shadow-sm">
        {/* Preset Sample Selector */}
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
            Test Real-World Viral Cases (نمونہ چیک کریں):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {FAKE_NEWS_SAMPLES.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSample(sample)}
                className="px-2.5 py-1 rounded-xl text-xs font-medium border border-[var(--border)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-95 text-left cursor-pointer"
              >
                {sample.verdict.includes('Hoax') ? '🚨 WhatsApp Hoax' : sample.verdict.includes('Doctored') ? '⚠️ Fake Circular' : '✅ Verified News'}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="space-y-4 pt-3 border-t border-[var(--border)]">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
              Paste Viral Message / Headline / Tweet / Circular Text
            </label>
            <textarea
              id="fake-news-text-input"
              rows={3}
              value={newsText}
              onChange={(e) => setNewsText(e.target.value)}
              placeholder="Paste suspicious text message, WhatsApp forward, or circular text here..."
              className="w-full p-3.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 resize-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* URL Input */}
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                Suspicious URL / Web Link
              </label>
              <input
                id="fake-news-url-input"
                type="text"
                value={newsUrl}
                onChange={(e) => setNewsUrl(e.target.value)}
                placeholder="e.g. bit.ly/gov-scheme or untrusted domain..."
                className="w-full py-2.5 px-3.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"
              />
            </div>

            {/* Screenshot Upload UI */}
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                Upload Screenshot / Circular
              </label>
              {!uploadedScreenshot ? (
                <label
                  htmlFor="fake-news-img-upload"
                  className="w-full py-2.5 px-3.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-muted)] flex items-center justify-between cursor-pointer hover:bg-[var(--surface-hover)] transition-all active:scale-98"
                >
                  <span className="truncate">Select Image / Notification (PNG, JPG)</span>
                  <span className="text-[11px] font-semibold text-[var(--accent)] shrink-0">Browse</span>
                  <input
                    id="fake-news-img-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
                  />
                </label>
              ) : (
                <div className="py-2 px-3 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    {uploadedScreenshot.previewUrl && (
                      <img
                        src={uploadedScreenshot.previewUrl}
                        alt="Preview"
                        className="w-6 h-6 rounded-lg object-cover border border-[var(--border)] shrink-0"
                      />
                    )}
                    <span className="text-[var(--text-primary)] font-medium truncate">
                      {uploadedScreenshot.file.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-0.5"
                    title="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Analyze Button */}
          <button
            type="submit"
            id="fake-news-analyze-btn"
            disabled={isAnalyzing || (!newsText.trim() && !newsUrl.trim() && !uploadedScreenshot)}
            className="px-4 py-2.5 rounded-xl bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:opacity-90 disabled:opacity-40 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSearch className="w-4 h-4" />
            )}
            <span>{isAnalyzing ? 'Evaluating Claims & Indicators...' : 'Analyze Credibility & Evidence'}</span>
          </button>
        </form>
      </div>

      {/* Loading Skeleton */}
      {isAnalyzing && (
        <div className="p-8 bg-[var(--surface)] rounded-2xl border border-[var(--border)] text-center space-y-3 animate-pulse shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--accent)]" />
          <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
            Investigating Viral Claims & Forensic Indicators...
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">
            Scanning institutional phrasing, circular typography, spoofed URLs, and official press releases
          </p>
        </div>
      )}

      {/* Results Dashboard */}
      {analysisResult && !isAnalyzing && (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 sm:p-6 space-y-5 animate-in fade-in duration-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Evaluation Output
              </span>
              <h2 className="text-base font-semibold text-[var(--text-primary)] mt-0.5">
                Fact-Check & Credibility Dashboard
              </h2>
            </div>

            {/* Verdict Badge & Speech Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div
                className={`px-3 py-1.5 rounded-md font-semibold text-xs flex items-center gap-1.5 w-fit border ${
                  isVerified
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : isSuspicious
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                }`}
              >
                {isVerified ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : isSuspicious ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                )}
                <span>{analysisResult.verdict}</span>
              </div>

              <SpeechPlayerControls
                id="fake-news-verdict"
                speakingId={tts.speakingId}
                playState={tts.playState}
                voiceError={tts.voiceError}
                activeLangName={tts.activeLangName}
                currentChunkIndex={tts.currentChunkIndex}
                totalChunks={tts.totalChunks}
                onPlay={() =>
                  tts.play(
                    'fake-news-verdict',
                    `${analysisResult.verdict}. ${analysisResult.summary}. ${analysisResult.recommendedAction}. ${analysisResult.evidence.join('. ')}`,
                    selectedLanguage
                  )
                }
                onPause={tts.pause}
                onResume={tts.resume}
                onStop={tts.stop}
                onClearError={tts.clearError}
              />
            </div>
          </div>

          {/* Credibility Score Meter */}
          <div className="p-4 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-[var(--text-muted)]">Calculated Credibility Score</span>
              <span
                className={
                  isVerified
                    ? 'text-emerald-500 font-bold'
                    : isSuspicious
                    ? 'text-amber-500 font-bold'
                    : 'text-rose-500 font-bold'
                }
              >
                {analysisResult.credibilityScore}% / 100%
              </span>
            </div>
            <div className="w-full h-2.5 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isVerified
                    ? 'bg-emerald-500'
                    : isSuspicious
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.max(5, analysisResult.credibilityScore)}%` }}
              />
            </div>
          </div>

          {/* Summary */}
          {analysisResult.summary && (
            <div className="p-3.5 bg-[var(--surface-secondary)]/60 rounded-lg border border-[var(--border)] text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              <FormattedMarkdown content={analysisResult.summary} />
            </div>
          )}

          {/* Evidence Breakdown */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Evidence & Verification Breakdown
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-[var(--text-secondary)]">
              {analysisResult.evidence.map((ev, idx) => (
                <li key={idx} className="p-3 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border)] flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] font-semibold text-[11px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{ev}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Source Information & Warning Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Warning Indicators */}
            <div className="p-4 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border)] space-y-2">
              <h4 className="text-xs font-semibold text-rose-500 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Warning Red Flags Identified
              </h4>
              <ul className="text-xs text-[var(--text-secondary)] space-y-1 list-disc pl-4">
                {analysisResult.redFlags.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>

            {/* Recommended Action */}
            <div className="p-4 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border)] space-y-2">
              <h4 className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Recommended Citizen Safety Action
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {analysisResult.recommendedAction}
              </p>
              {analysisResult.officialSource && (
                <p className="text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border)]">
                  Authority Channel: <span className="text-[var(--text-secondary)] font-medium">{analysisResult.officialSource}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
