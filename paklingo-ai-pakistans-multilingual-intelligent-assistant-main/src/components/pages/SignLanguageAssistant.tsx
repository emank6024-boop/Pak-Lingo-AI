import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Hand,
  Camera,
  Video,
  VideoOff,
  Search,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  Play,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Loader2,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  UploadCloud,
  X,
  Image as ImageIcon,
  Type,
  Volume2,
  Trash2,
  Eye,
} from 'lucide-react';
import { PSL_SIGNS } from '../../data/mockData';
import { LanguageCode } from '../../types';
import { useMultilingualTTS } from '../../hooks/useMultilingualTTS';
import { SpeechPlayerControls } from '../SpeechPlayerControls';
import { FormattedMarkdown } from '../FormattedMarkdown';
import { useDebounce } from '../../hooks/useDebounce';

interface SignLanguageAssistantProps {
  selectedLanguage: LanguageCode;
}

interface PSLToken {
  token: string;
  word?: string;
  urdu: string;
  handShape?: string;
  handMovement?: string;
  movement?: string;
  location?: string;
  facialExpression: string;
  instruction?: string;
  description: string;
  culturalNote?: string;
}

interface PSLBreakdownResult {
  originalText?: string;
  sentence: string;
  meaningHeader?: string;
  meaning?: string;
  pslGloss: string;
  urduGloss: string;
  explanation?: string;
  tokens: PSLToken[];
  signs?: PSLToken[];
  practiceTip?: string;
  grammaticalNotes: string;
}

interface PSLImageResult {
  identified: boolean;
  signName: string;
  meaningHeader: string;
  meaning: string;
  gestureDescription?: string;
  usageContext?: string;
  confidence?: string;
  tips?: string;
  fullExplanation?: string;
}

const PRESET_PSL_INPUTS = [
  'Assalam o Alaikum',
  'How are you?',
  'My name is Ali.',
  'Shukriya (Thank you)',
  'Water / پانی',
  'Mujhe doctor ki zaroorat hai',
];

export const SignLanguageAssistant: React.FC<SignLanguageAssistantProps> = ({ selectedLanguage }) => {
  const tts = useMultilingualTTS();

  // Active Tool Mode: 'text' | 'upload' | 'camera'
  const [activeMode, setActiveMode] = useState<'text' | 'upload' | 'camera'>('text');

  // Text Input State
  const [textToSignInput, setTextToSignInput] = useState('Assalam o Alaikum');
  const [isConverting, setIsConverting] = useState(false);
  const [breakdownResult, setBreakdownResult] = useState<PSLBreakdownResult | null>(null);
  const [activeTokenIndex, setActiveTokenIndex] = useState(0);

  // Image Upload State
  const uploadFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<{
    file: File;
    previewUrl: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [imageDragOver, setImageDragOver] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<PSLImageResult | null>(null);

  // Live Camera State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<{
    previewUrl: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [isAnalyzingCamera, setIsAnalyzingCamera] = useState(false);
  const [cameraAnalysisResult, setCameraAnalysisResult] = useState<PSLImageResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Dictionary & Demonstration State
  const [activeCategory, setActiveCategory] = useState<'All' | 'Greetings' | 'Civic' | 'Emergency' | 'Numbers' | 'Alphabets'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 150);
  const [selectedSign, setSelectedSign] = useState<typeof PSL_SIGNS[0]>(PSL_SIGNS[0]);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isPlayingMotion, setIsPlayingMotion] = useState(false);

  // General Error State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<(() => void) | null>(null);

  // Cleanup camera stream on unmount or mode switch
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Dictionary filtered list
  const filteredSigns = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return PSL_SIGNS.filter((s) => {
      const matchesCat = activeCategory === 'All' || s.category === activeCategory;
      if (!q) return matchesCat;
      const matchesQuery =
        s.word.toLowerCase().includes(q) ||
        s.urdu.includes(q) ||
        s.description.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [activeCategory, debouncedSearch]);

  const handlePlayMotion = () => {
    setIsPlayingMotion(true);
    setTimeout(() => {
      setIsPlayingMotion(false);
    }, 2000 / playbackSpeed);
  };

  // --- A) TEXT-TO-PSL BREAKDOWN ---
  const handleConvertToPSL = async (customText?: string) => {
    const targetText = (customText !== undefined ? customText : textToSignInput).trim();
    if (!targetText) {
      setErrorMessage('Please enter a word or sentence for sign language breakdown.');
      return;
    }

    setIsConverting(true);
    setErrorMessage(null);
    setLastAction(() => () => handleConvertToPSL(targetText));

    try {
      const res = await fetch('/api/psl/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: targetText,
          sentence: targetText,
          language: selectedLanguage,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server responded with status ${res.status}`);
      }

      const data: PSLBreakdownResult = await res.json();
      setBreakdownResult(data);
      setActiveTokenIndex(0);
      handlePlayMotion();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to translate sentence to PSL syntax right now. Please retry.');
    } finally {
      setIsConverting(false);
    }
  };

  // --- B) IMAGE UPLOAD & ANALYSIS ---
  const handleImageFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUploadedImage({
        file,
        previewUrl: URL.createObjectURL(file),
        base64,
        mimeType: file.type || 'image/jpeg',
      });
      setImageAnalysisResult(null);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const removeUploadedImage = () => {
    if (uploadedImage?.previewUrl) {
      URL.revokeObjectURL(uploadedImage.previewUrl);
    }
    setUploadedImage(null);
    setImageAnalysisResult(null);
    if (uploadFileInputRef.current) {
      uploadFileInputRef.current.value = '';
    }
  };

  const handleAnalyzeUploadedImage = async () => {
    if (!uploadedImage) {
      setErrorMessage('Please select or drag an image containing a hand sign first.');
      return;
    }

    setIsAnalyzingImage(true);
    setErrorMessage(null);
    setImageAnalysisResult(null);
    setLastAction(() => () => handleAnalyzeUploadedImage());

    try {
      const res = await fetch('/api/psl/analyze-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: uploadedImage.base64,
          mimeType: uploadedImage.mimeType,
          language: selectedLanguage,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data: PSLImageResult = await res.json();
      setImageAnalysisResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to analyze sign image right now. Please retry with a clearer photo.');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // --- C) REAL CAMERA CAPTURE & ANALYSIS ---
  const startCamera = async () => {
    setCameraError(null);
    setCapturedImage(null);
    setCameraAnalysisResult(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser environment. Please use image upload instead.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      setCameraStream(stream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.warn('Video play error:', err));
      }
    } catch (err: any) {
      console.error('Camera Access Error:', err);
      setIsCameraActive(false);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission denied. Please allow camera access in your browser or use the "Upload Sign Image" tab.'
          : err.message || 'Unable to access webcam. Please use the image upload option.'
      );
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
    }
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);

    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage({
      previewUrl: base64,
      base64,
      mimeType: 'image/jpeg',
    });
    setCameraAnalysisResult(null);

    // Stop camera stream after capture
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setCameraAnalysisResult(null);
    startCamera();
  };

  const handleAnalyzeCapturedImage = async () => {
    if (!capturedImage) return;

    setIsAnalyzingCamera(true);
    setErrorMessage(null);
    setCameraAnalysisResult(null);
    setLastAction(() => () => handleAnalyzeCapturedImage());

    try {
      const res = await fetch('/api/psl/analyze-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: capturedImage.base64,
          mimeType: capturedImage.mimeType,
          language: selectedLanguage,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data: PSLImageResult = await res.json();
      setCameraAnalysisResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to analyze captured sign image right now. Please retake photo with better lighting.');
    } finally {
      setIsAnalyzingCamera(false);
    }
  };

  const activeToken = breakdownResult?.tokens?.[activeTokenIndex];
  const meaningHeaderUrdu = 'اس سائن کا مطلب:';
  const meaningHeaderEn = 'Meaning of this sign:';
  const displayHeader = selectedLanguage === 'ur'
    ? meaningHeaderUrdu
    : (String(selectedLanguage).includes('roman'))
      ? 'Is sign ka matlab:'
      : meaningHeaderEn;

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
          Pakistan Sign Language (PSL) Assistant
        </h1>
        <p className="text-[var(--text-muted)] text-xs sm:text-sm">
          Real AI syntax translation, computer vision gesture recognition, webcam scanning, and standardized PSL dictionary.
        </p>
      </div>

      {/* Mandatory Regulatory & Cultural Notice */}
      <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-[var(--text-primary)]">
            Pakistan Sign Language (PSL / پاکستانی اشاروں کی زبان) Accessibility Standards
          </p>
          <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
            Standardized according to National Institute of Special Education (NISE), Pakistan Association of the Deaf (PAD), and Deaf Reach / FESF Pakistan.
          </p>
        </div>
      </div>

      {/* Error Notice with Retry */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Sign Language Assistant Notice</span>
          </div>
          <p className="text-xs leading-relaxed">{errorMessage}</p>
          {lastAction && (
            <button
              type="button"
              onClick={lastAction}
              disabled={isConverting || isAnalyzingImage || isAnalyzingCamera}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:opacity-90 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isConverting || isAnalyzingImage || isAnalyzingCamera ? 'animate-spin' : ''}`} />
              <span>Retry Action</span>
            </button>
          )}
        </div>
      )}

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => {
            setActiveMode('text');
            stopCamera();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer border active:scale-95 ${
            activeMode === 'text'
              ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
              : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Text to PSL (متن سے اشارہ)</span>
        </button>

        <button
          onClick={() => {
            setActiveMode('upload');
            stopCamera();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer border active:scale-95 ${
            activeMode === 'upload'
              ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
              : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Sign Image (تصویر سے اشارہ پہچانیں)</span>
        </button>

        <button
          onClick={() => {
            setActiveMode('camera');
            if (!isCameraActive && !capturedImage) {
              startCamera();
            }
          }}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer border active:scale-95 ${
            activeMode === 'camera'
              ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
              : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Camera Live Scan (کیمرہ لائیو اسکین)</span>
        </button>
      </div>

      {/* Main Grid: Interactive Mode on Right/Full, Visualizer on Left */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT COLUMN: Active Gesture Visualizer & Demonstration */}
        <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)] space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {activeToken ? 'Active Sentence Step' : `${selectedSign.category} Gesture`}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">
                    {activeToken
                      ? `${activeToken.token} (${activeToken.urdu})`
                      : `${selectedSign.word} (${selectedSign.urdu})`}
                  </h2>
                  <SpeechPlayerControls
                    id={`psl-${activeToken ? activeToken.token : selectedSign.id}`}
                    speakingId={tts.speakingId}
                    playState={tts.playState}
                    voiceError={tts.voiceError}
                    activeLangName={tts.activeLangName}
                    currentChunkIndex={tts.currentChunkIndex}
                    totalChunks={tts.totalChunks}
                    onPlay={() =>
                      tts.play(
                        `psl-${activeToken ? activeToken.token : selectedSign.id}`,
                        activeToken
                          ? `${activeToken.token}. ${activeToken.description}. Movement: ${activeToken.handMovement || activeToken.movement || ''}. Facial marker: ${activeToken.facialExpression}`
                          : `${selectedSign.urdu} (${selectedSign.word}). ${selectedSign.description}. ${selectedSign.movement}`,
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

              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Sliders className="w-3.5 h-3.5" />
                <span>Speed:</span>
                {[0.5, 1, 1.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-1.5 py-0.5 rounded-lg text-[11px] font-semibold cursor-pointer border transition-all active:scale-95 ${
                      playbackSpeed === speed
                        ? 'bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-primary)]'
                        : 'bg-[var(--surface-secondary)] border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Demonstration Canvas */}
            <div className="h-56 bg-[var(--surface-secondary)] rounded-xl relative overflow-hidden flex flex-col items-center justify-center text-[var(--text-primary)] p-5 border border-[var(--border)]">
              <div
                className={`p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] mb-3 transition-all duration-300 shadow-xs ${
                  isPlayingMotion ? 'scale-110 ring-4 ring-[var(--accent)]/30 border-[var(--accent)]' : ''
                }`}
              >
                <Hand className={`w-9 h-9 text-[var(--accent)] ${isPlayingMotion ? 'animate-bounce' : ''}`} />
              </div>

              <p className="text-sm font-semibold text-center text-[var(--text-primary)] px-2">
                {activeToken ? activeToken.description : selectedSign.description}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1 text-center">
                Movement: {activeToken ? activeToken.handMovement || activeToken.movement : selectedSign.movement}
              </p>
              {activeToken?.facialExpression && (
                <p className="text-[11px] text-[var(--accent)] mt-1 font-medium">
                  Facial Cue: {activeToken.facialExpression}
                </p>
              )}

              <button
                onClick={handlePlayMotion}
                className="mt-3 px-3.5 py-1.5 bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                {isPlayingMotion ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlayingMotion ? 'Simulating Gesture...' : 'Play Gesture Movement'}</span>
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] text-xs text-[var(--text-secondary)] space-y-1">
            <span className="font-semibold text-[var(--text-primary)]">PSL Visual Grammar:</span>
            <p className="text-[var(--text-muted)] leading-relaxed">
              In Pakistan Sign Language, facial markers (non-manual expressions) carry 50% of the grammatical information, differentiating questions from statements and showing cultural politeness.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Mode Panel (Text / Upload / Camera) */}
        <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)] space-y-4 shadow-sm flex flex-col justify-between">
          {/* MODE 1: TEXT INPUT */}
          {activeMode === 'text' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Type className="w-4 h-4 text-[var(--accent)]" />
                  <span>Text to Pakistan Sign Language Converter</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Enter any word, greeting, or sentence in Urdu, English, or Roman Urdu.
                </p>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[11px] font-medium text-[var(--text-muted)] block mb-1.5">
                  Quick examples:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_PSL_INPUTS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTextToSignInput(preset);
                        handleConvertToPSL(preset);
                      }}
                      className="px-2.5 py-1 text-xs rounded-md bg-[var(--surface-secondary)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleConvertToPSL();
                }}
                className="space-y-3"
              >
                <div>
                  <label className="text-xs font-medium text-[var(--text-primary)] block mb-1">
                    Word or Sentence (جملہ یا لفظ درج کریں):
                  </label>
                  <input
                    type="text"
                    value={textToSignInput}
                    onChange={(e) => setTextToSignInput(e.target.value)}
                    placeholder="e.g. Assalam o Alaikum, How are you? Or: My name is Ali."
                    className="w-full py-2.5 px-3.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--focus-ring)]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isConverting || !textToSignInput.trim()}
                    className="px-4 py-2 bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer shadow-xs flex items-center gap-2 transition-colors"
                  >
                    {isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{isConverting ? 'Processing with AI...' : 'Convert to PSL (اشارہ حاصل کریں)'}</span>
                  </button>

                  {breakdownResult && (
                    <button
                      type="button"
                      onClick={() => {
                        setBreakdownResult(null);
                        setTextToSignInput('');
                      }}
                      className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* MODE 2: IMAGE UPLOAD */}
          {activeMode === 'upload' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-[var(--accent)]" />
                  <span>Upload Sign Language Photo</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Upload an image showing a hand gesture to identify its meaning in Pakistan Sign Language.
                </p>
              </div>

              <input
                ref={uploadFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageFileSelect(file);
                }}
              />

              {!uploadedImage ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setImageDragOver(true);
                  }}
                  onDragLeave={() => setImageDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setImageDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleImageFileSelect(file);
                  }}
                  onClick={() => uploadFileInputRef.current?.click()}
                  className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    imageDragOver
                      ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                      : 'border-[var(--border)] bg-[var(--surface-secondary)]/50 hover:bg-[var(--surface-secondary)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <UploadCloud className="w-8 h-8 text-[var(--accent)] mb-2" />
                  <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
                    Click to browse or drag & drop sign photo
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Supports JPG, PNG, or WebP. Make sure fingers and palm are clearly visible.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={uploadedImage.previewUrl}
                        alt="Uploaded gesture"
                        className="w-16 h-16 rounded-lg object-cover border border-[var(--border)] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {uploadedImage.file.name}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {(uploadedImage.file.size / 1024).toFixed(1)} KB • Ready for AI Sign Interpretation
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => uploadFileInputRef.current?.click()}
                        className="px-2.5 py-1 text-xs rounded-md bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={removeUploadedImage}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAnalyzeUploadedImage}
                    disabled={isAnalyzingImage}
                    className="w-full py-2.5 bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    {isAnalyzingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>
                      {isAnalyzingImage
                        ? 'Analyzing Pakistan Sign Language Gesture...'
                        : 'Analyze Sign Gesture (اشارہ پہچانیں)'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE 3: LIVE CAMERA */}
          {activeMode === 'camera' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[var(--accent)]" />
                    <span>Real Webcam Gesture Scanner</span>
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Position your hand in frame, capture the gesture, and analyze with AI.
                  </p>
                </div>

                {!isCameraActive && !capturedImage && (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Open Camera</span>
                  </button>
                )}
              </div>

              {cameraError && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-700 dark:text-amber-300 space-y-2">
                  <p>{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => setActiveMode('upload')}
                    className="text-xs underline font-semibold cursor-pointer"
                  >
                    Switch to image upload instead
                  </button>
                </div>
              )}

              {/* Camera Active View */}
              {isCameraActive && (
                <div className="space-y-3">
                  <div className="h-56 bg-black rounded-xl relative overflow-hidden border border-[var(--border)] flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="w-full h-full object-cover"
                    />

                    {/* Viewfinder Target Guide */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-36 h-36 border-2 border-dashed border-emerald-400/80 rounded-2xl flex items-center justify-center animate-pulse">
                        <Hand className="w-8 h-8 text-emerald-400/50" />
                      </div>
                    </div>

                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] text-emerald-400 flex items-center gap-1.5 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>LIVE PSL SCAN</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capture Sign Photo (تصویر لیں)</span>
                    </button>

                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] text-xs text-[var(--text-secondary)] hover:text-red-500 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Captured Photo Preview */}
              {capturedImage && !isCameraActive && (
                <div className="space-y-3">
                  <div className="h-56 bg-[var(--surface-secondary)] rounded-xl relative overflow-hidden border border-[var(--border)] flex items-center justify-center">
                    <img
                      src={capturedImage.previewUrl}
                      alt="Captured hand sign"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] text-white font-medium">
                      Snapshot Captured
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAnalyzeCapturedImage}
                      disabled={isAnalyzingCamera}
                      className="flex-1 py-2.5 bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                    >
                      {isAnalyzingCamera ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span>
                        {isAnalyzingCamera
                          ? 'Analyzing Sign with AI...'
                          : 'Analyze Captured Sign (اشارے کا تجزیہ کریں)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={retakePhoto}
                      disabled={isAnalyzingCamera}
                      className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-xs text-[var(--text-secondary)] transition-colors cursor-pointer"
                    >
                      Retake
                    </button>
                  </div>
                </div>
              )}

              {!isCameraActive && !capturedImage && !cameraError && (
                <div className="h-44 bg-[var(--surface-secondary)] rounded-xl border border-dashed border-[var(--border)] flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)] space-y-2">
                  <Camera className="w-7 h-7 text-[var(--text-muted)]" />
                  <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
                    Camera Ready
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] max-w-xs">
                    Click "Open Camera" to capture and recognize your hand sign live using Gemini AI vision.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quick Tip Footer */}
          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>Powered by Gemini Multimodal AI</span>
            <span>PAD & NISE Standards</span>
          </div>
        </div>
      </div>

      {/* D) MANDATORY RESULT DISPLAY: "اس سائن کا مطلب:" */}
      {/* 1. Text Breakdown Result */}
      {breakdownResult && (
        <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)] space-y-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                {breakdownResult.meaningHeader || displayHeader}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mt-1">
                {breakdownResult.meaning || breakdownResult.explanation}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-secondary)]">
                  Gloss: {breakdownResult.pslGloss}
                </span>
                <span className="text-xs font-urdu text-[var(--text-secondary)]">
                  {breakdownResult.urduGloss}
                </span>
              </div>
            </div>

            <SpeechPlayerControls
              id="psl-breakdown-gloss"
              speakingId={tts.speakingId}
              playState={tts.playState}
              voiceError={tts.voiceError}
              activeLangName={tts.activeLangName}
              currentChunkIndex={tts.currentChunkIndex}
              totalChunks={tts.totalChunks}
              onPlay={() =>
                tts.play(
                  'psl-breakdown-gloss',
                  `${breakdownResult.meaningHeader || displayHeader} ${breakdownResult.meaning || breakdownResult.explanation}. PSL Gloss: ${breakdownResult.pslGloss}.`,
                  selectedLanguage
                )
              }
              onPause={tts.pause}
              onResume={tts.resume}
              onStop={tts.stop}
              onClearError={tts.clearError}
            />
          </div>

          {/* Tokens Sequence Steps */}
          <div>
            <span className="text-xs font-medium text-[var(--text-muted)] block mb-2">
              Sign Language Components (Click any sign to load into visualizer):
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {breakdownResult.tokens.map((tok, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveTokenIndex(idx);
                    handlePlayMotion();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTokenIndex === idx
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs font-semibold'
                      : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span className="font-bold">{idx + 1}.</span>
                  <span>{tok.token || tok.word}</span>
                  <span className="opacity-80">({tok.urdu})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step Detail Card */}
          {activeToken && (
            <div className="p-4 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  Step {activeTokenIndex + 1}: {activeToken.token} ({activeToken.urdu})
                </span>
                {activeToken.handShape && (
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Shape: {activeToken.handShape}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {activeToken.instruction || activeToken.description}
              </p>
              {activeToken.location && (
                <p className="text-[11px] text-[var(--text-muted)]">
                  Location: {activeToken.location}
                </p>
              )}
            </div>
          )}

          {breakdownResult.practiceTip && (
            <div className="p-3 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border)] text-xs text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">Practice Tip: </span>
              {breakdownResult.practiceTip}
            </div>
          )}
        </div>
      )}

      {/* 2. Image / Camera Recognition Result */}
      {(imageAnalysisResult || cameraAnalysisResult) && (
        <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)] space-y-4 shadow-sm animate-in fade-in duration-200">
          {(() => {
            const res = imageAnalysisResult || cameraAnalysisResult;
            if (!res) return null;

            return (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                        {res.meaningHeader || displayHeader}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          res.identified
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                        }`}
                      >
                        {res.identified ? `Identified (${res.confidence || 'High'})` : 'Uncertain / Unclear'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mt-1">
                      {res.signName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <SpeechPlayerControls
                      id="psl-vision-result"
                      speakingId={tts.speakingId}
                      playState={tts.playState}
                      voiceError={tts.voiceError}
                      activeLangName={tts.activeLangName}
                      currentChunkIndex={tts.currentChunkIndex}
                      totalChunks={tts.totalChunks}
                      onPlay={() =>
                        tts.play(
                          'psl-vision-result',
                          `${res.meaningHeader || displayHeader} ${res.signName}. ${res.meaning}. ${res.gestureDescription || ''}`,
                          selectedLanguage
                        )
                      }
                      onPause={tts.pause}
                      onResume={tts.resume}
                      onStop={tts.stop}
                      onClearError={tts.clearError}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setImageAnalysisResult(null);
                        setCameraAnalysisResult(null);
                      }}
                      className="px-2.5 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>

                {/* Meaning Highlight Block */}
                <div className="p-4 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] space-y-2">
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    {res.meaningHeader || displayHeader}
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text-primary)] font-medium leading-relaxed">
                    {res.meaning}
                  </p>
                </div>

                {/* Handshape & Movement Analysis */}
                {res.gestureDescription && (
                  <div className="p-3 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border)] space-y-1 text-xs text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--text-primary)]">Gesture & Handshape Analysis:</span>
                    <p className="text-[var(--text-muted)] leading-relaxed">{res.gestureDescription}</p>
                  </div>
                )}

                {/* Cultural Usage Context */}
                {res.usageContext && (
                  <div className="p-3 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border)] space-y-1 text-xs text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--text-primary)]">Usage Context in Pakistan:</span>
                    <p className="text-[var(--text-muted)] leading-relaxed">{res.usageContext}</p>
                  </div>
                )}

                {/* Helpful Tips if not identified */}
                {res.tips && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-lg text-xs text-amber-700 dark:text-amber-300">
                    <span className="font-semibold">Photo Tips: </span>
                    {res.tips}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* PSL Dictionary Section */}
      <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Standardized Pakistan Sign Language (PSL) Dictionary
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Click any sign card below to preview its gesture animation in the visualizer above.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sign gesture..."
              className="w-full pl-9 pr-3 py-1.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--focus-ring)]"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5">
          {(['All', 'Greetings', 'Civic', 'Emergency', 'Numbers', 'Alphabets'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
                activeCategory === cat
                  ? 'bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-primary)] shadow-xs font-semibold'
                  : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredSigns.map((s) => {
            const isSelected = selectedSign.id === s.id && !breakdownResult;
            return (
              <div
                key={s.id}
                onClick={() => {
                  setBreakdownResult(null);
                  setSelectedSign(s);
                  handlePlayMotion();
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[var(--surface-hover)] border-[var(--accent)] ring-1 ring-[var(--accent)] text-[var(--text-primary)]'
                    : 'bg-[var(--surface-secondary)] border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] px-2 py-0.5 rounded">
                      {s.category}
                    </span>
                    <Hand className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] mt-2">{s.word}</h3>
                  <p className="text-xs font-urdu text-[var(--text-secondary)]">{s.urdu}</p>
                </div>

                <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 pt-2 border-t border-[var(--border)]">
                  {s.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

