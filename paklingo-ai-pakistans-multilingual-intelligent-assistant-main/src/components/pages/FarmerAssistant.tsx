import React, { useState, useRef } from 'react';
import {
  Sprout,
  Droplets,
  Bug,
  Sun,
  Layers,
  Send,
  Loader2,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Image as ImageIcon,
  UploadCloud,
  X,
  RefreshCw,
} from 'lucide-react';
import { LanguageCode } from '../../types';
import { useMultilingualTTS } from '../../hooks/useMultilingualTTS';
import { SpeechPlayerControls } from '../SpeechPlayerControls';
import { FarmerMarkdown } from '../FarmerMarkdown';

interface FarmerAssistantProps {
  selectedLanguage: LanguageCode;
}

const CROPS = [
  'Wheat (گندم)',
  'Cotton (کپاس)',
  'Rice (دھان / چاول)',
  'Sugarcane (کماد / گنا)',
  'Maize / Corn (مکئی)',
  'Citrus / Kinnow (کنو / مالٹا)',
  'Mango (آم)',
  'Potato (آلو)',
  'Vegetables & Pulses (سبزیاں و دالیں)',
];

const PRESET_FARMER_QUERIES = [
  'If my wheat crop has yellow leaves, what could be the reason? (گندم کے پتے پیلے کیوں ہو رہے ہیں؟)',
  'What fertilizer is suitable for wheat? (گندم کے لیے کھاد کا بہترین تناسب)',
  'My cotton crop is not growing properly, what should I check? (کپاس کی بڑھوتری رکنے کی وجوہات)',
  'How to identify and control Pink Bollworm (گلابی سنڈی) and whitefly in Cotton',
  'Water-saving laser land leveling and alternate wetting & drying (AWD) for Basmati Rice',
  'Punjab Kisan Card: Eligibility criteria, loan subsidy limits, and application process',
];

export const FarmerAssistant: React.FC<FarmerAssistantProps> = ({ selectedLanguage }) => {
  const tts = useMultilingualTTS();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'advisory' | 'disease' | 'fertilizer' | 'schemes'>('advisory');
  const [selectedCrop, setSelectedCrop] = useState<string>('Wheat (گندم)');
  const [questionInput, setQuestionInput] = useState<string>('');
  const [diseaseSymptoms, setDiseaseSymptoms] = useState<string>('');
  const [growthStage, setGrowthStage] = useState<string>('Sowing / Germination');
  const [acreage, setAcreage] = useState<string>('5 acres');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [responseContent, setResponseContent] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<(() => void) | null>(null);

  // Plant image upload state
  const [selectedImage, setSelectedImage] = useState<{
    file: File;
    previewUrl: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [imageDragOver, setImageDragOver] = useState(false);

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage({
        file,
        previewUrl: URL.createObjectURL(file),
        base64,
        mimeType: file.type || 'image/jpeg',
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    if (selectedImage?.previewUrl) {
      URL.revokeObjectURL(selectedImage.previewUrl);
    }
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!questionInput.trim() && !selectedImage) {
      setErrorMessage('Please enter an agricultural question or upload a crop photo.');
      return;
    }
    setIsLoading(true);
    setResponseContent(null);
    setErrorMessage(null);
    setLastAction(() => () => handleAsk());

    try {
      const res = await fetch('/api/farmer/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionInput,
          crop: selectedCrop,
          language: selectedLanguage,
          imageBase64: selectedImage?.base64,
          mimeType: selectedImage?.mimeType,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }
      const data = await res.json();
      const content = data.answer || data.guidance || data.analysis || data.text;
      if (!content) {
        throw new Error('No response content received from Farmer AI.');
      }
      setResponseContent(content);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to Farmer AI service right now. Please check your connection and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiseaseCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!diseaseSymptoms.trim() && !selectedImage) {
      alert('Please enter a description of symptoms or upload a photo of the plant.');
      return;
    }
    setIsLoading(true);
    setResponseContent(null);
    setErrorMessage(null);
    setLastAction(() => () => handleDiseaseCheck());

    try {
      const res = await fetch('/api/farmer/disease-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: selectedCrop,
          description: diseaseSymptoms,
          symptoms: diseaseSymptoms,
          imageBase64: selectedImage?.base64,
          mimeType: selectedImage?.mimeType,
          language: selectedLanguage,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }
      const data = await res.json();
      setResponseContent(data.analysis || data.text || 'Pathology analysis completed.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to complete disease diagnosis right now. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFertilizerCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setResponseContent(null);
    setErrorMessage(null);
    setLastAction(() => () => handleFertilizerCalculate());

    try {
      const res = await fetch('/api/farmer/fertilizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: selectedCrop,
          growthStage,
          acreage,
          language: selectedLanguage,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }
      const data = await res.json();
      setResponseContent(data.recommendation || data.guidance || data.text || 'Fertilizer schedule prepared.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to calculate fertilizer schedule right now. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
            Kisan Agriculture Hub
          </h1>
          <p className="text-[var(--text-muted)] text-xs sm:text-sm">
            Agronomy advisory, crop disease diagnosis, and fertilizer management in regional languages.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap bg-[var(--surface-secondary)] p-1 rounded-lg border border-[var(--border)] self-start sm:self-auto gap-0.5">
          <button
            onClick={() => setActiveTab('advisory')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'advisory'
                ? 'bg-[var(--accent)] text-white shadow-xs font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Ask Specialist
          </button>
          <button
            onClick={() => setActiveTab('disease')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'disease'
                ? 'bg-[var(--accent)] text-white shadow-xs font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Disease & Pest
          </button>
          <button
            onClick={() => setActiveTab('fertilizer')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'fertilizer'
                ? 'bg-[var(--accent)] text-white shadow-xs font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Fertilizer Plan
          </button>
          <button
            onClick={() => setActiveTab('schemes')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'schemes'
                ? 'bg-[var(--accent)] text-white shadow-xs font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Kisan Schemes
          </button>
        </div>
      </div>

      {/* Advisory Transparency Banner */}
      <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)]/70 border border-[var(--border)] text-[var(--text-secondary)] text-xs flex items-start gap-3">
        <Sprout className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-[var(--text-primary)]">
            Kisan Agriculture Intelligence Hub (کسان زرعی رہنمائی)
          </p>
          <p className="text-[var(--text-muted)] leading-relaxed">
            Practical agronomy recommendations adapted for Pakistani agro-ecological zones (Indus Basin canal irrigation, Barani rainfed zones). Always verify localized soil testing with your local Tehsil Agriculture Extension Office.
          </p>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-4 shadow-sm">
        {/* Crop Selector Bar */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
            Select Crop Focus (فصل منتخب کریں):
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {CROPS.map((crop) => (
              <button
                key={crop}
                onClick={() => setSelectedCrop(crop)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                  selectedCrop === crop
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs font-semibold'
                    : 'bg-[var(--surface-secondary)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {crop}
              </button>
            ))}
          </div>
        </div>

        {/* Preset Chips */}
        <div>
          <span className="text-xs font-medium text-[var(--text-muted)] block mb-2">
            Frequent Inquiries:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_FARMER_QUERIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuestionInput(q);
                  setActiveTab('advisory');
                }}
                className="px-2.5 py-1 rounded-md text-xs font-medium border border-[var(--border)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-left cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="pt-2 border-t border-[var(--border)]">
          {/* Tab 1: Advisory & Photo Question */}
          {activeTab === 'advisory' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--text-primary)] block mb-1.5">
                  Write your farming question or crop issue for {selectedCrop}:
                </label>
                <textarea
                  rows={2}
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder="e.g. If my wheat crop has yellow leaves, what could be the reason? Or: Why does this cotton leaf look like this?"
                  className="w-full p-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--focus-ring)] resize-none"
                />
              </div>

              {/* Working Plant/Crop Image Upload Component */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Upload Crop Photo (تصویر اپلوڈ کریں):</span>
                  </label>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {selectedImage ? '1 photo attached' : 'Optional: Attach leaf/crop photo'}
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect(file);
                  }}
                />

                {!selectedImage ? (
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
                      if (file) handleImageSelect(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-3.5 border-2 border-dashed rounded-xl flex items-center justify-center gap-3 cursor-pointer transition-colors ${
                      imageDragOver
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                        : 'border-[var(--border)] bg-[var(--surface-secondary)]/50 hover:bg-[var(--surface-secondary)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <UploadCloud className="w-5 h-5 text-[var(--accent)] shrink-0" />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-[var(--text-primary)]">
                        Click or drag to attach crop, leaf, or field photo
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        AI will inspect the photo together with your question (JPG, PNG, WebP)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={selectedImage.previewUrl}
                        alt="Uploaded crop preview"
                        className="w-14 h-14 rounded-lg object-cover border border-[var(--border)] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {selectedImage.file.name}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {(selectedImage.file.size / 1024).toFixed(1)} KB • Attached for AI visual analysis
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-xs rounded-md bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAsk()}
                  disabled={isLoading || (!questionInput.trim() && !selectedImage)}
                  className="px-4 py-2.5 bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : selectedImage ? (
                    <Sparkles className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>
                    {selectedImage
                      ? 'Submit Image & Question to AI'
                      : 'Ask Agricultural Specialist'}
                  </span>
                </button>

                {(questionInput || selectedImage || responseContent) && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuestionInput('');
                      removeImage();
                      setResponseContent(null);
                      setErrorMessage(null);
                    }}
                    className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Disease & Pest Diagnosis */}
          {activeTab === 'disease' && (
            <form onSubmit={handleDiseaseCheck} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--text-primary)] block mb-1.5">
                  Describe visual symptoms, leaf spots, insect damage, or root issues:
                </label>
                <textarea
                  rows={3}
                  value={diseaseSymptoms}
                  onChange={(e) => setDiseaseSymptoms(e.target.value)}
                  placeholder="e.g. Yellowing leaf tips with brown rust powdery pustules on lower leaves after recent rainfall..."
                  className="w-full p-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--focus-ring)] resize-none"
                />
              </div>

              {/* Plant Photo Upload Section */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--text-primary)] flex items-center justify-between">
                  <span>Upload Plant / Leaf / Crop Photo (تصویر اپلوڈ کریں):</span>
                  <span className="text-[11px] text-[var(--text-muted)]">Optional but highly recommended</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect(file);
                  }}
                />

                {!selectedImage ? (
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
                      if (file) handleImageSelect(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                      imageDragOver
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                        : 'border-[var(--border)] bg-[var(--surface-secondary)]/50 hover:bg-[var(--surface-secondary)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <UploadCloud className="w-6 h-6 text-[var(--text-muted)] mb-1" />
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                      Click to upload or drag & drop leaf/crop photo
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Supports JPG, PNG, or WebP (max 10MB)
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={selectedImage.previewUrl}
                        alt="Uploaded plant preview"
                        className="w-14 h-14 rounded-lg object-cover border border-[var(--border)] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {selectedImage.file.name}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {(selectedImage.file.size / 1024).toFixed(1)} KB • Ready for AI Pathology Scan
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || (!diseaseSymptoms.trim() && !selectedImage)}
                className="px-4 py-2.5 bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bug className="w-4 h-4" />}
                <span>{selectedImage ? 'Analyze Photo & Diagnose Disease' : 'Diagnose Symptoms & Remedial Spray'}</span>
              </button>
            </form>
          )}

          {/* Tab 3: Fertilizer Plan */}
          {activeTab === 'fertilizer' && (
            <form onSubmit={handleFertilizerCalculate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
                    Crop Stage:
                  </label>
                  <select
                    value={growthStage}
                    onChange={(e) => setGrowthStage(e.target.value)}
                    className="w-full p-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--input-text)] focus:outline-none focus:border-[var(--focus-ring)] cursor-pointer"
                  >
                    <option value="Sowing / Germination">Sowing / Germination (بوائی)</option>
                    <option value="Tillering / Vegetative">Tillering / Vegetative (شاخیں نکلنا)</option>
                    <option value="Flowering / Booting">Flowering / Booting (گوبھ کا وقت)</option>
                    <option value="Grain Formation / Maturation">Grain Formation / Maturation (پکاؤ)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
                    Acreage / Farm Land:
                  </label>
                  <input
                    type="text"
                    value={acreage}
                    onChange={(e) => setAcreage(e.target.value)}
                    placeholder="e.g. 5 acres, 25 acres"
                    className="w-full p-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--focus-ring)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Droplets className="w-4 h-4" />}
                <span>Calculate Fertilizer Schedule</span>
              </button>
            </form>
          )}

          {/* Tab 4: Kisan Schemes */}
          {activeTab === 'schemes' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1.5 shadow-xs">
                <h4 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-500" />
                  Punjab Kisan Card
                </h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Interest-free production loans up to Rs. 150,000 for purchasing certified seed, DAP/Urea, and pesticides via registered biometric retailers.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1.5 shadow-xs">
                <h4 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  Solar Tubewell Subsidy
                </h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Federal & Provincial cost-sharing (up to 67% subsidy) for transitioning diesel and high-tariff tubewells to solar pumping stations.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1.5 shadow-xs">
                <h4 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-sky-500" />
                  Crop Loan Insurance (CLIS)
                </h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  State Bank of Pakistan (SBP) premium subsidy covering calamity damages (floods, severe drought, pest attacks) for small landholders.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Notice with Retry */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Advisory Request Encountered an Issue</span>
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
              <span>Retry Analysis</span>
            </button>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 space-y-3 text-center animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--accent)]" />
          <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)]">
            Consulting Crop Pathology & Agronomy AI...
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">
            Analyzing plant indicators, local soil parameters, and official pest advisories
          </p>
        </div>
      )}

      {/* Response Display with FarmerMarkdown */}
      {responseContent && !isLoading && (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-4 animate-in fade-in duration-150 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-[var(--surface-secondary)] text-emerald-500 border border-[var(--border)]">
                <Sprout className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Agronomy Intelligence Guidance
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <SpeechPlayerControls
                id="farmer-advisory-result"
                speakingId={tts.speakingId}
                playState={tts.playState}
                voiceError={tts.voiceError}
                activeLangName={tts.activeLangName}
                currentChunkIndex={tts.currentChunkIndex}
                totalChunks={tts.totalChunks}
                onPlay={() => tts.play('farmer-advisory-result', responseContent, selectedLanguage)}
                onPause={tts.pause}
                onResume={tts.resume}
                onStop={tts.stop}
                onClearError={tts.clearError}
              />
              <button
                type="button"
                onClick={() => setResponseContent(null)}
                className="px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="text-[var(--text-secondary)] text-xs sm:text-sm">
            <FarmerMarkdown content={responseContent} />
          </div>
        </div>
      )}
    </div>
  );
};
