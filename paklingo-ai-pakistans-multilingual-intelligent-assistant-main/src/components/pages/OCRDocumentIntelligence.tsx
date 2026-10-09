import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Scan,
  Sparkles,
  Copy,
  Check,
  Languages,
  Search,
  FileCheck2,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  Loader2,
  RefreshCw,
  X,
  AlertTriangle,
} from 'lucide-react';
import { LanguageCode } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { useMultilingualTTS } from '../../hooks/useMultilingualTTS';
import { SpeechPlayerControls } from '../SpeechPlayerControls';
import { FormattedMarkdown } from '../FormattedMarkdown';
import { useAuth } from '../../context/AuthContext';
import { recordUserActivity } from '../../lib/firestoreService';

interface OCRDocumentIntelligenceProps {
  selectedLanguage: LanguageCode;
}

const SAMPLE_DOCS = [
  {
    id: 'wapda-bill',
    name: 'WAPDA / LESCO Electricity Bill (بجلی کا بل)',
    type: 'Utility Bill',
    extractedContent: `GOVERNMENT OF PAKISTAN - WATER & POWER DEVELOPMENT AUTHORITY
LESCO ELECTRICITY CONSUMER BILL
Reference No: 08 11254 0984321 U
Consumer Name: MUHAMMAD ARSHAD S/O ABDUL MAJEED
Address: House 42, St 5, Gulberg III, Lahore
Tariff: A-1a(01) Residential Single Phase
Billing Month: AUGUST 2026
Issue Date: 12-AUG-2026 | Due Date: 22-AUG-2026
Units Consumed: 384 kWh (Peak: 110, Off-Peak: 274)
Cost of Electricity: PKR 14,592.00
FPA (Fuel Price Adjustment): PKR 1,240.50
Electricity Duty: PKR 218.88
General Sales Tax (GST 18%): PKR 2,845.00
TV Fee: PKR 35.00
Total Amount Payable Within Due Date: PKR 18,930.00
Late Payment Surcharge: PKR 1,450.00
Amount Payable After Due Date: PKR 20,380.00`,
    summary: `### Document Overview: LESCO Electricity Consumer Utility Bill
- **Due Date:** 22-August-2026 (Urgent: Pay before deadline to avoid PKR 1,450 surcharge).
- **Payable Amount:** PKR 18,930.00 (Units consumed: 384 kWh).
- **Consumer Ref No:** 08 11254 0984321 U (Registered to Muhammad Arshad).
- **Tariff Type:** Residential Single Phase A-1a(01).`,
  },
  {
    id: 'fard-land',
    name: 'Land Record Fard-e-Malkiyat (فرد ملکیت زمین)',
    type: 'Revenue Document',
    extractedContent: `محکمہ مال حکومت پنجاب - پنجاب لینڈ ریکارڈ اتھارٹی (PLRA)
فرد برائے بیع / ریکارڈ ملکیت
فرد نمبر: PLRA-LHR-2026-98124
موضع / چک: 45 کلاں، تحصیل ماڈل ٹاؤن، ضلع لاہور
نام مالک: طارق محمود ولد چوہدری اصغر علی
شناختی کارڈ نمبر: 35201-1234567-9
کھیوٹ نمبر: 142 | کھتونی نمبر: 289
کل رقبہ مندرجہ فرد: 4 کنال 12 مرلہ
حقوق آبپاشی: نہری بذریعہ موگھہ نمبر 18-R راوی کینال
کیفیت و رہن: یہ اراضی ہر قسم کے بینک لون یا عدالتی حکم امتناعی سے پاک ہے۔`,
    summary: `### دستاویز کی تفصیل: فرد ملکیت زمین (PLRA Land Title Certificate)
- **مالک کا نام:** طارق محمود ولد چوہدری اصغر علی (شناختی کارڈ: 35201-1234567-9)
- **رقبہ:** 4 کنال 12 مرلہ (موضع 45 کلاں، تحصیل ماڈل ٹاؤن لاہور)
- **قانونی حیثیت:** اراضی عدالتی اسٹے اور بینک رہن سے پاک ہے۔
- **آبپاشی حقوق:** نہری بذریعہ موگھہ نمبر 18-R راوی کینال۔`,
  },
];

export const OCRDocumentIntelligence: React.FC<OCRDocumentIntelligenceProps> = ({ selectedLanguage }) => {
  const { user } = useAuth();
  const tts = useMultilingualTTS();
  const [selectedDocSample, setSelectedDocSample] = useState(SAMPLE_DOCS[0]);
  const [extractedText, setExtractedText] = useState(SAMPLE_DOCS[0].extractedContent);
  const [uploadedFile, setUploadedFile] = useState<{
    file: File;
    previewUrl?: string;
    base64?: string;
    mimeType: string;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [docSummary, setDocSummary] = useState<string | null>(SAMPLE_DOCS[0].summary);
  const [targetLang, setTargetLang] = useState<LanguageCode>('ur');
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<(() => void) | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isImg = file.type.startsWith('image/');
      const reader = new FileReader();

      reader.onload = async () => {
        const fileObj = {
          file,
          previewUrl: isImg ? URL.createObjectURL(file) : undefined,
          base64: reader.result as string,
          mimeType: file.type || 'application/octet-stream',
        };
        setUploadedFile(fileObj);
        await runOCRProcess(fileObj);
      };
      reader.readAsDataURL(file);
    }
  };

  const runOCRProcess = async (fileObj: { file: File; base64?: string; mimeType: string }) => {
    setIsScanning(true);
    setErrorMessage(null);
    setTranslatedText(null);
    setLastAction(() => () => runOCRProcess(fileObj));

    try {
      const res = await fetch('/api/documents/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'ocr',
          imageBase64: fileObj.base64,
          mimeType: fileObj.mimeType,
          targetLanguage: selectedLanguage,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `OCR engine returned status ${res.status}`);
      }

      const data = await res.json();
      const extracted = data.extractedText || data.result || 'Text extraction complete.';
      setExtractedText(extracted);

      // Record activity to history and Firestore
      recordUserActivity({
        userId: user?.id,
        type: 'document',
        title: uploadedFile?.file?.name ? `Scanned: ${uploadedFile.file.name}` : `Document Scan: ${selectedDocSample.name.slice(0, 35)}`,
        subtitle: extracted.slice(0, 120) + (extracted.length > 120 ? '...' : ''),
        module: 'Document Intelligence',
        targetPage: 'documents',
        language: selectedLanguage,
      }).catch(() => {});

      // Also trigger a summary automatically
      if (data.summary) {
        setDocSummary(data.summary);
      } else {
        runSummarize(extracted);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to scan document. Please retry.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleRunSampleScan = () => {
    setIsScanning(true);
    setErrorMessage(null);
    setTimeout(() => {
      setIsScanning(false);
      setExtractedText(selectedDocSample.extractedContent);
      setDocSummary(selectedDocSample.summary);
      setTranslatedText(null);
    }, 400);
  };

  const runSummarize = async (contentToSummarize?: string) => {
    const text = contentToSummarize || extractedText;
    if (!text.trim()) return;

    setIsSummarizing(true);
    setErrorMessage(null);
    setLastAction(() => () => runSummarize(text));

    try {
      const res = await fetch('/api/documents/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'summarize',
          documentText: text,
          targetLanguage: selectedLanguage,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Summarization error status ${res.status}`);
      }

      const data = await res.json();
      setDocSummary(data.summary || data.result || 'Summary generated.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to generate summary. Please retry.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleTranslate = async () => {
    if (!extractedText.trim()) return;

    setIsTranslating(true);
    setErrorMessage(null);
    setLastAction(() => () => handleTranslate());

    try {
      const res = await fetch('/api/documents/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'translate',
          documentText: extractedText,
          targetLanguage: targetLang,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Translation error status ${res.status}`);
      }

      const data = await res.json();
      setTranslatedText(data.translatedText || data.result || 'Translation complete.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to translate document text. Please retry.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const removeUploadedFile = () => {
    if (uploadedFile?.previewUrl) {
      URL.revokeObjectURL(uploadedFile.previewUrl);
    }
    setUploadedFile(null);
    setSelectedDocSample(SAMPLE_DOCS[0]);
    setExtractedText(SAMPLE_DOCS[0].extractedContent);
    setDocSummary(SAMPLE_DOCS[0].summary);
    setTranslatedText(null);
  };

  // Search highlighting within extracted text
  const renderHighlightedText = () => {
    if (!searchTerm.trim()) {
      return extractedText;
    }
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = extractedText.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={i} className="bg-amber-300 text-neutral-900 rounded-xs px-0.5 font-bold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-[var(--surface)] rounded-2xl p-5 sm:p-6 border border-[var(--border)] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              Document Workspace
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Extract, inspect, summarize, and translate official Pakistani utility bills, stamp papers, and legal certificates.
            </p>
          </div>
          <span className="text-[11px] font-medium text-[var(--text-secondary)] bg-[var(--surface-secondary)] border border-[var(--border)] px-2.5 py-1 rounded-md w-fit">
            Multimodal AI Nastaliq & Latin OCR
          </span>
        </div>

        {/* Preset Sample Selector & File Upload Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[var(--text-muted)]">Samples:</span>
            {SAMPLE_DOCS.map((doc) => (
              <button
                key={doc.id}
                onClick={() => {
                  setUploadedFile(null);
                  setSelectedDocSample(doc);
                  setExtractedText(doc.extractedContent);
                  setDocSummary(doc.summary);
                  setTranslatedText(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                  !uploadedFile && selectedDocSample.id === doc.id
                    ? 'bg-[var(--accent)] text-white font-semibold shadow-xs'
                    : 'bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                }`}
              >
                {doc.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="ocr-file-upload"
              className="px-3.5 py-1.5 bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl text-xs font-medium text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Upload Document / Scan</span>
              <input
                id="ocr-file-upload"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileUpload}
              />
            </label>

            <button
              id="run-ocr-button"
              onClick={handleRunSampleScan}
              disabled={isScanning}
              className="px-3.5 py-1.5 bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              {isScanning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Scan className="w-3.5 h-3.5" />
              )}
              <span>{isScanning ? 'Extracting...' : 'Scan Document'}</span>
            </button>
          </div>
        </div>

        {/* Uploaded File Banner */}
        {uploadedFile && (
          <div className="p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {uploadedFile.previewUrl ? (
                <img
                  src={uploadedFile.previewUrl}
                  alt="Document thumbnail"
                  className="w-12 h-12 rounded object-cover border border-[var(--border)] shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[var(--accent)]" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {uploadedFile.file.name}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {(uploadedFile.file.size / 1024).toFixed(1)} KB • AI Bilingual OCR Active
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeUploadedFile}
              className="p-1 rounded text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
              title="Remove uploaded document"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Error Banner with Retry */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Document Processing Issue</span>
          </div>
          <p className="text-xs leading-relaxed">{errorMessage}</p>
          {lastAction && (
            <button
              type="button"
              onClick={lastAction}
              disabled={isScanning || isSummarizing || isTranslating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:opacity-90 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>Retry Operation</span>
            </button>
          )}
        </div>
      )}

      {/* Main Grid: Left Extracted Text & Search, Right Summary & Translation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Search & Extracted Text */}
        <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)] shadow-sm space-y-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[var(--accent)]" />
              Extracted Content
            </h2>
            <div className="flex items-center gap-2">
              <SpeechPlayerControls
                id="ocr-extracted-text"
                speakingId={tts.speakingId}
                playState={tts.playState}
                voiceError={tts.voiceError}
                activeLangName={tts.activeLangName}
                currentChunkIndex={tts.currentChunkIndex}
                totalChunks={tts.totalChunks}
                onPlay={() => tts.play('ocr-extracted-text', extractedText, selectedLanguage)}
                onPause={tts.pause}
                onResume={tts.resume}
                onStop={tts.stop}
                onClearError={tts.clearError}
              />
              <button
                onClick={handleCopyText}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Search Within Document UI */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="ocr-doc-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in document (e.g. Due Date, units, CNIC)..."
              className="w-full pl-9 pr-3 py-1.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-all"
            />
          </div>

          {/* Interactive OCR Preview Box */}
          <div className="relative border border-[var(--border)] rounded-xl p-3.5 bg-[var(--surface-secondary)]/50 min-h-[300px] max-h-[420px] overflow-y-auto text-xs font-mono whitespace-pre-line leading-relaxed text-[var(--text-primary)]">
            {isScanning && (
              <div className="absolute inset-0 bg-[var(--surface)]/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
                <Loader2 className="w-6 h-6 text-[var(--accent)] animate-spin" />
                <span className="text-xs font-medium text-[var(--text-secondary)] animate-pulse">
                  Recognizing characters via multimodal OCR...
                </span>
              </div>
            )}
            {renderHighlightedText()}
          </div>
        </div>

        {/* Right: AI Summary & Multilingual Translation */}
        <div className="space-y-5">
          {/* Summary Box */}
          <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)] shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Document Summary & Key Entities
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {docSummary && (
                  <SpeechPlayerControls
                    id="ocr-doc-summary"
                    speakingId={tts.speakingId}
                    playState={tts.playState}
                    voiceError={tts.voiceError}
                    activeLangName={tts.activeLangName}
                    currentChunkIndex={tts.currentChunkIndex}
                    totalChunks={tts.totalChunks}
                    onPlay={() => tts.play('ocr-doc-summary', docSummary, selectedLanguage)}
                    onPause={tts.pause}
                    onResume={tts.resume}
                    onStop={tts.stop}
                    onClearError={tts.clearError}
                  />
                )}
                <button
                  onClick={() => runSummarize()}
                  disabled={isSummarizing || !extractedText.trim()}
                  className="px-2.5 py-1 bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-50 text-[var(--text-primary)] rounded-md text-xs font-medium transition-colors border border-[var(--border)] cursor-pointer flex items-center gap-1"
                >
                  {isSummarizing && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>{isSummarizing ? 'Summarizing...' : 'Regenerate'}</span>
                </button>
              </div>
            </div>

            {docSummary && (
              <div className="p-4 bg-[var(--surface-secondary)]/50 rounded-xl border border-[var(--border)]">
                <FormattedMarkdown content={docSummary} />
              </div>
            )}
          </div>

          {/* Multilingual Translation Section */}
          <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)] shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Translate Document</h3>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
                  className="py-1 px-2.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-md text-xs font-medium text-[var(--text-primary)] focus:outline-none cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-[var(--dropdown-bg)] text-[var(--dropdown-text)]">
                      {l.name} ({l.nativeName})
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleTranslate}
                  disabled={isTranslating || !extractedText.trim()}
                  className="px-3 py-1 bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-white rounded-md text-xs font-medium cursor-pointer transition-colors shadow-xs flex items-center gap-1"
                >
                  {isTranslating && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>{isTranslating ? 'Translating...' : 'Translate'}</span>
                </button>
              </div>
            </div>

            {translatedText && (
              <div className="space-y-2">
                <div className="flex justify-end">
                  <SpeechPlayerControls
                    id="ocr-translated-text"
                    speakingId={tts.speakingId}
                    playState={tts.playState}
                    voiceError={tts.voiceError}
                    activeLangName={tts.activeLangName}
                    currentChunkIndex={tts.currentChunkIndex}
                    totalChunks={tts.totalChunks}
                    onPlay={() => tts.play('ocr-translated-text', translatedText, targetLang)}
                    onPause={tts.pause}
                    onResume={tts.resume}
                    onStop={tts.stop}
                    onClearError={tts.clearError}
                  />
                </div>
                <div className="p-4 bg-[var(--surface-secondary)]/50 rounded-xl border border-[var(--border)]">
                  <FormattedMarkdown content={translatedText} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
