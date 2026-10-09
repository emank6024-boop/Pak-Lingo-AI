import React, { useState } from 'react';
import {
  Scale,
  ShieldAlert,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  BookOpen,
  Send,
  Sparkles,
  Info,
  Layers,
  Loader2,
  RefreshCw,
  X,
  FileCheck,
} from 'lucide-react';
import { LanguageCode } from '../../types';
import { useMultilingualTTS } from '../../hooks/useMultilingualTTS';
import { SpeechPlayerControls } from '../SpeechPlayerControls';
import { FormattedMarkdown } from '../FormattedMarkdown';

interface LegalAssistantProps {
  selectedLanguage: LanguageCode;
}

const PROVINCES = [
  'All Pakistan / Federal',
  'Punjab (پنجاب)',
  'Sindh (سندھ)',
  'Khyber Pakhtunkhwa (خیبر پختونخوا)',
  'Balochistan (بلوچستان)',
  'Islamabad Capital Territory (ICT)',
];

export const LegalAssistant: React.FC<LegalAssistantProps> = ({ selectedLanguage }) => {
  const tts = useMultilingualTTS();
  const [legalQuery, setLegalQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('All Pakistan / Federal');
  const [legalResponse, setLegalResponse] = useState<string | null>(null);
  const [uploadedDoc, setUploadedDoc] = useState<{
    file: File;
    previewUrl?: string;
    base64?: string;
    mimeType: string;
    textPreview?: string;
  } | null>(null);
  const [docAnalysis, setDocAnalysis] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ask' | 'analysis' | 'rights'>('ask');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<(() => void) | null>(null);

  const handleAskLegal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!legalQuery.trim()) return;
    setIsLoading(true);
    setLegalResponse(null);
    setErrorMessage(null);
    setLastAction(() => () => handleAskLegal());

    try {
      const res = await fetch('/api/legal/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: legalQuery,
          province: selectedProvince,
          language: selectedLanguage,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server responded with code ${res.status}`);
      }

      const data = await res.json();
      setLegalResponse(data.legalResponse || data.guidance || data.answer || 'Legal response processed.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to Legal AI service right now. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isImg = file.type.startsWith('image/');
      const reader = new FileReader();

      reader.onload = async () => {
        const base64 = reader.result as string;
        const docObj = {
          file,
          previewUrl: isImg ? URL.createObjectURL(file) : undefined,
          base64,
          mimeType: file.type || 'application/octet-stream',
        };
        setUploadedDoc(docObj);
        await runDocAnalysis(docObj);
      };
      reader.readAsDataURL(file);
    }
  };

  const runDocAnalysis = async (docObj: { file: File; base64?: string; mimeType: string }) => {
    setIsLoading(true);
    setDocAnalysis(null);
    setErrorMessage(null);
    setLastAction(() => () => runDocAnalysis(docObj));

    try {
      const res = await fetch('/api/legal/explain-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: `Legal Document Review for: ${docObj.file.name}`,
          imageBase64: docObj.base64,
          mimeType: docObj.mimeType,
          language: selectedLanguage,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server responded with code ${res.status}`);
      }

      const data = await res.json();
      setDocAnalysis(data.analysis || data.summary || data.explanation || 'Contract analysis completed.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to analyze document clauses right now. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearDoc = () => {
    if (uploadedDoc?.previewUrl) {
      URL.revokeObjectURL(uploadedDoc.previewUrl);
    }
    setUploadedDoc(null);
    setDocAnalysis(null);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
            Civic & Legal Intelligence
          </h1>
          <p className="text-[var(--text-muted)] text-xs sm:text-sm">
            Statutory awareness, tenancy frameworks, and contract clause risk analysis.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap bg-[var(--surface-secondary)] p-1 rounded-lg border border-[var(--border)] self-start sm:self-auto gap-0.5">
          {[
            { id: 'ask' as const, label: 'Legal Inquiry', icon: <HelpCircle className="w-3.5 h-3.5" /> },
            { id: 'analysis' as const, label: 'Contract Scanner', icon: <FileText className="w-3.5 h-3.5" /> },
            { id: 'rights' as const, label: 'Constitutional Rights', icon: <BookOpen className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[var(--accent)] text-white shadow-xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Prominent Mandatory Legal Disclaimer */}
      <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)]/70 border border-[var(--border)] text-[var(--text-secondary)] text-xs flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-[var(--text-primary)]">Mandatory Legal Disclaimer</p>
          <p className="text-[var(--text-secondary)]">
            “This provides general legal information, not legal advice. Verify important matters with a qualified legal professional.”
          </p>
          <p className="text-[var(--text-muted)] text-[11px] leading-relaxed">
            PakLingo AI provides civic literacy and plain-language statutory summaries. It does not establish an attorney-client relationship.
          </p>
        </div>
      </div>

      {/* Error State with Retry */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Legal Assistant Notice</span>
          </div>
          <p className="text-xs leading-relaxed">{errorMessage}</p>
          {lastAction && (
            <button
              type="button"
              onClick={lastAction}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:opacity-90 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Retry Request</span>
            </button>
          )}
        </div>
      )}

      {/* TAB 1: Ask Legal Question */}
      {activeTab === 'ask' && (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-4 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Inquire About Pakistani Laws & Rights</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Ask about consumer protection, tenancy rights, employment rules, or family inheritance.
            </p>
          </div>

          <form onSubmit={handleAskLegal} className="space-y-3">
            {/* Province Selection */}
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
                Jurisdiction / Province:
              </label>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full sm:w-72 p-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--input-text)] focus:outline-none focus:border-[var(--focus-ring)] cursor-pointer"
              >
                {PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              id="legal-question-input"
              rows={3}
              value={legalQuery}
              onChange={(e) => setLegalQuery(e.target.value)}
              placeholder="e.g. Can my landlord increase rent arbitrarily every 6 months without notice in Punjab? What is the lawful procedure?..."
              className="w-full p-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--focus-ring)] resize-none"
            />

            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <span className="text-[11px] text-[var(--text-muted)]">Popular questions:</span>
              <button
                type="button"
                onClick={() => setLegalQuery('What are tenant rights regarding security deposit refund and eviction notice under Punjab Rented Premises Act?')}
                className="px-2 py-0.5 bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Security deposit refund
              </button>
              <button
                type="button"
                onClick={() => setLegalQuery('What are female inheritance rights under Enforcement of Women’s Property Rights Act 2020?')}
                className="px-2 py-0.5 bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Female inheritance rights
              </button>
              <button
                type="button"
                onClick={() => setLegalQuery('What is the legal notice procedure before filing a complaint in the District Consumer Protection Court?')}
                className="px-2 py-0.5 bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Consumer court notice
              </button>
            </div>

            <button
              type="submit"
              id="legal-submit-btn"
              disabled={isLoading || !legalQuery.trim()}
              className="px-4 py-2.5 bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Get Statutory Information</span>
            </button>
          </form>

          {/* Loading Indicator */}
          {isLoading && !legalResponse && (
            <div className="p-6 text-center space-y-2 bg-[var(--surface-secondary)]/40 rounded-xl border border-[var(--border)]">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--accent)]" />
              <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)]">
                Querying Statutory Enactments & High Court Precedents...
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                Analyzing relevant sections and procedural rights for {selectedProvince}
              </p>
            </div>
          )}

          {/* Legal Response Area */}
          {legalResponse && !isLoading && (
            <div className="space-y-3 pt-3 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-[var(--accent)]" />
                  Statutory Guidance Result
                </span>
                <div className="flex items-center gap-2">
                  <SpeechPlayerControls
                    id="legal-guidance-response"
                    speakingId={tts.speakingId}
                    playState={tts.playState}
                    voiceError={tts.voiceError}
                    activeLangName={tts.activeLangName}
                    currentChunkIndex={tts.currentChunkIndex}
                    totalChunks={tts.totalChunks}
                    onPlay={() => tts.play('legal-guidance-response', legalResponse, selectedLanguage)}
                    onPause={tts.pause}
                    onResume={tts.resume}
                    onStop={tts.stop}
                    onClearError={tts.clearError}
                  />
                  <button
                    type="button"
                    onClick={() => setLegalResponse(null)}
                    className="px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="p-4 bg-[var(--surface-secondary)]/50 rounded-xl border border-[var(--border)]">
                <FormattedMarkdown content={legalResponse} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Document & Contract Analysis */}
      {activeTab === 'analysis' && (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-4 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Upload Legal Agreement for Clause Risk Review</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Upload rental lease, employment contract, or stamp paper agreement to identify unfair or unilateral terms.
            </p>
          </div>

          {!uploadedDoc ? (
            <div className="border border-dashed border-[var(--border)] rounded-xl p-8 text-center bg-[var(--surface-secondary)]/40 hover:bg-[var(--surface-secondary)] transition-colors">
              <Upload className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)]">Upload Agreement (Image, Scan, or Document)</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">Automatic clause breakdown and tenant/employee liability flags</p>
              <label
                htmlFor="legal-doc-input"
                className="mt-4 inline-block px-4 py-2 bg-[var(--accent)] text-white hover:opacity-90 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Browse Contract
                <input
                  id="legal-doc-input"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleDocUpload}
                />
              </label>
            </div>
          ) : (
            <div className="p-4 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {uploadedDoc.previewUrl ? (
                  <img
                    src={uploadedDoc.previewUrl}
                    alt="Document preview"
                    className="w-14 h-14 rounded-lg object-cover border border-[var(--border)] shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0">
                    <FileCheck className="w-6 h-6 text-[var(--accent)]" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {uploadedDoc.file.name}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {(uploadedDoc.file.size / 1024).toFixed(1)} KB • AI Clause Risk Audit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearDoc}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                title="Remove contract"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Loading state for doc */}
          {isLoading && !docAnalysis && (
            <div className="p-6 text-center space-y-2 bg-[var(--surface-secondary)]/40 rounded-xl border border-[var(--border)]">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--accent)]" />
              <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)]">
                Scanning Agreement Clauses & Liability Terms...
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                Comparing contract provisions with statutory standards and highlighting risks
              </p>
            </div>
          )}

          {docAnalysis && !isLoading && (
            <div className="space-y-3 pt-3 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[var(--accent)]" />
                  Clause Risk Audit
                </span>
                <SpeechPlayerControls
                  id="legal-doc-analysis"
                  speakingId={tts.speakingId}
                  playState={tts.playState}
                  voiceError={tts.voiceError}
                  activeLangName={tts.activeLangName}
                  currentChunkIndex={tts.currentChunkIndex}
                  totalChunks={tts.totalChunks}
                  onPlay={() => tts.play('legal-doc-analysis', docAnalysis, selectedLanguage)}
                  onPause={tts.pause}
                  onResume={tts.resume}
                  onStop={tts.stop}
                  onClearError={tts.clearError}
                />
              </div>
              <div className="p-4 bg-[var(--surface-secondary)]/50 rounded-xl border border-[var(--border)]">
                <FormattedMarkdown content={docAnalysis} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Constitutional Rights Awareness */}
      {activeTab === 'rights' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-[var(--surface)] rounded-xl border border-[var(--border)] space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] bg-[var(--surface-secondary)] border border-[var(--border)] px-2 py-0.5 rounded">
                Article 9 & 10 (1973 Constitution)
              </span>
              <SpeechPlayerControls
                id="right-art-9-10"
                speakingId={tts.speakingId}
                playState={tts.playState}
                voiceError={tts.voiceError}
                activeLangName={tts.activeLangName}
                currentChunkIndex={tts.currentChunkIndex}
                totalChunks={tts.totalChunks}
                onPlay={() =>
                  tts.play(
                    'right-art-9-10',
                    'Article 9 and 10: Protection of Life, Liberty and Fair Trial. No citizen can be deprived of life or liberty save in accordance with law. Under Article 10, any arrested person must be informed of the grounds of arrest without delay and produced before a magistrate within 24 hours.',
                    selectedLanguage
                  )
                }
                onPause={tts.pause}
                onResume={tts.resume}
                onStop={tts.stop}
                onClearError={tts.clearError}
              />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Protection of Life, Liberty & Fair Trial</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              No citizen can be deprived of life or liberty save in accordance with law. Under Article 10, any arrested person must be informed of the grounds of arrest without delay and produced before a magistrate within 24 hours.
            </p>
          </div>

          <div className="p-5 bg-[var(--surface)] rounded-xl border border-[var(--border)] space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] bg-[var(--surface-secondary)] border border-[var(--border)] px-2 py-0.5 rounded">
                Article 25A
              </span>
              <SpeechPlayerControls
                id="right-art-25a"
                speakingId={tts.speakingId}
                playState={tts.playState}
                voiceError={tts.voiceError}
                activeLangName={tts.activeLangName}
                currentChunkIndex={tts.currentChunkIndex}
                totalChunks={tts.totalChunks}
                onPlay={() =>
                  tts.play(
                    'right-art-25a',
                    'Article 25A: Right to Free and Compulsory Education. The State is constitutionally mandated to provide free and compulsory education to all children aged five to sixteen years.',
                    selectedLanguage
                  )
                }
                onPause={tts.pause}
                onResume={tts.resume}
                onStop={tts.stop}
                onClearError={tts.clearError}
              />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Right to Free & Compulsory Education</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              The State is constitutionally mandated to provide free and compulsory education to all children aged five to sixteen years in such manner as may be determined by law.
            </p>
          </div>

          <div className="p-5 bg-[var(--surface)] rounded-xl border border-[var(--border)] space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] bg-[var(--surface-secondary)] border border-[var(--border)] px-2 py-0.5 rounded">
                Code of Criminal Procedure (CrPC)
              </span>
              <SpeechPlayerControls
                id="right-crpc"
                speakingId={tts.speakingId}
                playState={tts.playState}
                voiceError={tts.voiceError}
                activeLangName={tts.activeLangName}
                currentChunkIndex={tts.currentChunkIndex}
                totalChunks={tts.totalChunks}
                onPlay={() =>
                  tts.play(
                    'right-crpc',
                    'Code of Criminal Procedure: Police Search and Encounter Rights. A search of a residential premise must strictly occur in the presence of two respectable inhabitants of the locality. A female citizen cannot be searched except by another female with strict regard to decency.',
                    selectedLanguage
                  )
                }
                onPause={tts.pause}
                onResume={tts.resume}
                onStop={tts.stop}
                onClearError={tts.clearError}
              />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Police Search & Encounter Rights</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              A search of a residential premise must strictly occur in the presence of two respectable inhabitants of the locality. A female citizen cannot be searched except by another female with strict regard to decency.
            </p>
          </div>

          <div className="p-5 bg-[var(--surface)] rounded-xl border border-[var(--border)] space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] bg-[var(--surface-secondary)] border border-[var(--border)] px-2 py-0.5 rounded">
                Consumer Protection Act
              </span>
              <SpeechPlayerControls
                id="right-consumer"
                speakingId={tts.speakingId}
                playState={tts.playState}
                voiceError={tts.voiceError}
                activeLangName={tts.activeLangName}
                currentChunkIndex={tts.currentChunkIndex}
                totalChunks={tts.totalChunks}
                onPlay={() =>
                  tts.play(
                    'right-consumer',
                    'Consumer Protection Act: Consumer Court Remedy. If a product or service is defective or overpriced, citizens can approach dedicated District Consumer Protection Courts without hefty court stamp fees for replacement and compensation.',
                    selectedLanguage
                  )
                }
                onPause={tts.pause}
                onResume={tts.resume}
                onStop={tts.stop}
                onClearError={tts.clearError}
              />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Consumer Court Remedy</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              If a product or service is defective or overpriced, citizens can approach dedicated District Consumer Protection Courts without hefty court stamp fees for replacement and compensation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
