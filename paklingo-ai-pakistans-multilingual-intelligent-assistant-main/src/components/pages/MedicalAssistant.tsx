import React, { useState } from 'react';
import {
  HeartPulse,
  Activity,
  AlertTriangle,
  Pill,
  ShieldAlert,
  Send,
  Loader2,
  PhoneCall,
  CheckCircle2,
  Info,
  Stethoscope,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { LanguageCode } from '../../types';
import { useMultilingualTTS } from '../../hooks/useMultilingualTTS';
import { SpeechPlayerControls } from '../SpeechPlayerControls';
import { MedicalMarkdown } from '../MedicalMarkdown';
import { medicalQueryCache } from '../../utils/cache';

interface MedicalAssistantProps {
  selectedLanguage: LanguageCode;
}

const COMMON_HEALTH_QUERIES = [
  'First aid steps for high fever (Dengue warning signs) in children',
  'What diet and lifestyle steps help manage Type 2 Diabetes?',
  'First response for acute chest discomfort or suspected heart attack',
  'Precautions for smog and seasonal pollen allergy in Punjab & Islamabad',
  'Safe oral rehydration protocol (ORS) for severe diarrhea and cholera',
];

export const MedicalAssistant: React.FC<MedicalAssistantProps> = ({ selectedLanguage }) => {
  const tts = useMultilingualTTS();
  const [activeTab, setActiveTab] = useState<'symptoms' | 'ask' | 'medicine' | 'emergency'>('symptoms');
  const [symptomsInput, setSymptomsInput] = useState<string>('');
  const [duration, setDuration] = useState<string>('1-2 days');
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>('Moderate');
  const [queryInput, setQueryInput] = useState<string>('');
  const [medicineInput, setMedicineInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [medicalResponse, setMedicalResponse] = useState<string | null>(null);

  const handleSymptomCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomsInput.trim()) return;
    setIsLoading(true);
    setMedicalResponse(null);

    try {
      const res = await fetch('/api/medical/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptomsInput,
          duration,
          severity,
          language: selectedLanguage,
        }),
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setMedicalResponse(data.result || data.triageResult || data.guidance || data.text || data.explanation);
    } catch {
      setMedicalResponse(
        `### Symptom Assessment for: "${symptomsInput}"\n**Reported Duration:** ${duration} | **Severity:** ${severity}\n\n1. **Potential Underlying Physiological Factors:** Common seasonal viral infections, dehydration, or inflammatory responses.\n2. **Home Supportive Care Measures:**\n   - Maintain rigorous oral fluid hydration (boiled water, ORS electrolytes).\n   - Monitor body temperature and resting pulse.\n   - Ensure complete physical rest.\n3. **Red Flag Warning Signs (Seek Emergency Care Immediately):**\n   - Breathing difficulty, blue lips, severe chest pain, or persistent vomiting.\n\n> Notice: Educational information — not a diagnosis or a substitute for a healthcare professional.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = queryInput.trim();
    if (!trimmed || isLoading) return;

    const cacheKey = `ask_${selectedLanguage}_${trimmed.toLowerCase()}`;
    const cached = medicalQueryCache.get(cacheKey);
    if (cached) {
      setMedicalResponse(cached);
      return;
    }

    setIsLoading(true);
    setMedicalResponse(null);

    try {
      const res = await fetch('/api/medical/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          language: selectedLanguage,
        }),
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      const resText = data.answer || data.text || data.guidance;
      medicalQueryCache.set(cacheKey, resText);
      setMedicalResponse(resText);
    } catch {
      const fallbackText = `### Health Guidance for: "${trimmed}"\n\n1. **Core Understanding:** Key medical principles explained in accessible, patient-friendly terms.\n2. **Preventive Practices:** Daily hygiene, balanced nutrition, safe drinking water, and age-appropriate physical activity.\n3. **Consultation Advice:** Discuss symptoms and lab reports with an MBBS physician registered with the Pakistan Medical & Dental Council (PMDC).\n\n> Notice: Educational information — not a diagnosis or a substitute for a healthcare professional.`;
      setMedicalResponse(fallbackText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMedicineLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = medicineInput.trim();
    if (!trimmed || isLoading) return;

    const cacheKey = `med_${selectedLanguage}_${trimmed.toLowerCase()}`;
    const cached = medicalQueryCache.get(cacheKey);
    if (cached) {
      setMedicalResponse(cached);
      return;
    }

    setIsLoading(true);
    setMedicalResponse(null);

    try {
      const res = await fetch('/api/medical/medicine-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicineName: trimmed,
          language: selectedLanguage,
        }),
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      const resText = data.info || data.text;
      medicalQueryCache.set(cacheKey, resText);
      setMedicalResponse(resText);
    } catch {
      const fallbackText = `### Medication Information: ${trimmed}\n\n1. **General Therapeutic Class:** Commonly prescribed for symptomatic relief under clinical supervision.\n2. **Usage & Administration Precautions:** Always verify the exact dosage prescribed on your written doctor prescription.\n3. **Contraindications & Side Effects:** Inform your physician of any liver, kidney, or cardiovascular pre-existing conditions.\n\n> Notice: Educational information — not a diagnosis or a substitute for a healthcare professional.`;
      setMedicalResponse(fallbackText);
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
            Health & Medical Assistant
          </h1>
          <p className="text-[var(--text-muted)] text-xs sm:text-sm">
            Symptom triage, general health literacy, and emergency guidance in Pakistani languages.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap bg-[var(--surface-secondary)] p-1 rounded-lg border border-[var(--border)] self-start sm:self-auto gap-0.5">
          <button
            onClick={() => setActiveTab('symptoms')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'symptoms'
                ? 'bg-[var(--accent)] text-white shadow-xs font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Symptom Guide
          </button>
          <button
            onClick={() => setActiveTab('ask')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'ask'
                ? 'bg-[var(--accent)] text-white shadow-xs font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Ask Health
          </button>
          <button
            onClick={() => setActiveTab('medicine')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'medicine'
                ? 'bg-[var(--accent)] text-white shadow-xs font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Medicine Info
          </button>
          <button
            onClick={() => setActiveTab('emergency')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'emergency'
                ? 'bg-[var(--accent)] text-white shadow-xs font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Emergency 1122
          </button>
        </div>
      </div>

      {/* Mandatory Medical Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)]/70 border border-[var(--border)] text-[var(--text-secondary)] text-xs flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-[var(--text-primary)]">
            Mandatory Public Health Disclaimer (طبی انتباہ)
          </p>
          <p className="text-[var(--text-muted)] leading-relaxed">
            Educational information only — not a clinical diagnosis or a substitute for a doctor. For acute emergencies, call <strong className="font-bold text-[var(--text-primary)]">1122 (Rescue)</strong> or visit the nearest hospital emergency room.
          </p>
        </div>
      </div>

      {/* Workspace Box */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-4 shadow-sm">
        {/* Quick Topics */}
        <div>
          <span className="text-xs font-medium text-[var(--text-muted)] block mb-2">
            Common Health Inquiries:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_HEALTH_QUERIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQueryInput(q);
                  setActiveTab('ask');
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
          {/* Tab 1: Symptom Guide */}
          {activeTab === 'symptoms' && (
            <form onSubmit={handleSymptomCheck} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--text-primary)] block mb-1.5">
                  Describe symptoms (علامات درج کریں):
                </label>
                <textarea
                  rows={3}
                  value={symptomsInput}
                  onChange={(e) => setSymptomsInput(e.target.value)}
                  placeholder="e.g. Mild continuous headache, dry cough, slight fever for the past 2 days..."
                  className="w-full p-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--focus-ring)] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
                    Duration:
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full p-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--input-text)] focus:outline-none focus:border-[var(--focus-ring)] cursor-pointer"
                  >
                    <option value="Less than 24 hours">Less than 24 hours</option>
                    <option value="1-2 days">1-2 days</option>
                    <option value="3-7 days">3-7 days</option>
                    <option value="More than 1 week">More than 1 week</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">
                    Severity Level:
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full p-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--input-text)] focus:outline-none focus:border-[var(--focus-ring)] cursor-pointer"
                  >
                    <option value="Mild">Mild (Does not prevent routine tasks)</option>
                    <option value="Moderate">Moderate (Uncomfortable, requires rest)</option>
                    <option value="Severe">Severe (Intense / distressing symptoms)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !symptomsInput.trim()}
                className="px-4 py-2 bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                <span>Analyze Symptoms & Supportive Care</span>
              </button>
            </form>
          )}

          {/* Tab 2: Ask Health Question */}
          {activeTab === 'ask' && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-[var(--text-primary)] block">
                Ask any health, preventive care, or lifestyle wellness question:
              </label>
              <form onSubmit={handleAskQuestion} className="flex gap-2">
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="e.g. How to protect elderly family members during extreme heatwaves?"
                  className="flex-1 px-3.5 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--focus-ring)]"
                />
                <button
                  type="submit"
                  disabled={isLoading || !queryInput.trim()}
                  className="px-4 py-2.5 bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span className="hidden sm:inline">Ask</span>
                </button>
              </form>
            </div>
          )}

          {/* Tab 3: Medicine Information */}
          {activeTab === 'medicine' && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-[var(--text-primary)] block">
                Enter brand name or generic salt of medicine (دوا کی معلومات):
              </label>
              <form onSubmit={handleMedicineLookup} className="flex gap-2">
                <input
                  type="text"
                  value={medicineInput}
                  onChange={(e) => setMedicineInput(e.target.value)}
                  placeholder="e.g. Panadol (Paracetamol), Augmentin, Metformin, Omeprazole..."
                  className="flex-1 px-3.5 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--focus-ring)]"
                />
                <button
                  type="submit"
                  disabled={isLoading || !medicineInput.trim()}
                  className="px-4 py-2.5 bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pill className="w-4 h-4" />}
                  <span className="hidden sm:inline">Lookup</span>
                </button>
              </form>
            </div>
          )}

          {/* Tab 4: Emergency Contacts */}
          {activeTab === 'emergency' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--text-primary)] text-lg">1122</span>
                  <PhoneCall className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <h4 className="text-xs font-semibold text-[var(--text-primary)]">Rescue 1122</h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Ambulance, fire rescue, and road emergency response across all provinces.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--text-primary)] text-lg">115</span>
                  <PhoneCall className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <h4 className="text-xs font-semibold text-[var(--text-primary)]">Edhi Ambulance</h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  24/7 national welfare emergency dispatch and emergency transport.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--text-primary)] text-lg">1020</span>
                  <PhoneCall className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <h4 className="text-xs font-semibold text-[var(--text-primary)]">Chhipa Ambulance</h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Rapid emergency rescue and patient transit in major metropolitan centers.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Response Display with MedicalMarkdown */}
      {medicalResponse && (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 space-y-4 animate-in fade-in duration-150 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-[var(--surface-secondary)] text-rose-500 border border-[var(--border)]">
                <Stethoscope className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Clinical Health Literacy Guidance
              </h3>
            </div>

            <SpeechPlayerControls
              id="medical-guidance-result"
              speakingId={tts.speakingId}
              playState={tts.playState}
              voiceError={tts.voiceError}
              activeLangName={tts.activeLangName}
              currentChunkIndex={tts.currentChunkIndex}
              totalChunks={tts.totalChunks}
              onPlay={() => tts.play('medical-guidance-result', medicalResponse, selectedLanguage)}
              onPause={tts.pause}
              onResume={tts.resume}
              onStop={tts.stop}
              onClearError={tts.clearError}
            />
          </div>

          <div className="text-[var(--text-secondary)] text-xs sm:text-sm">
            <MedicalMarkdown content={medicalResponse} />
          </div>
        </div>
      )}
    </div>
  );
};
