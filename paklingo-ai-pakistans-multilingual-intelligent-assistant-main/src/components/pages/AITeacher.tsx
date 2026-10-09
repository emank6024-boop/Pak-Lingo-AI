import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  HelpCircle,
  Layers,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  BookMarked,
  Award,
  Lightbulb,
  Check,
  Copy,
  AlertCircle,
} from 'lucide-react';
import { LanguageCode } from '../../types';
import { useMultilingualTTS } from '../../hooks/useMultilingualTTS';
import { SpeechPlayerControls } from '../SpeechPlayerControls';
import { teacherQueryCache } from '../../utils/cache';
import { EducationalMarkdown } from '../EducationalMarkdown';
import {
  SUBJECT_CONFIGS,
  GRADES,
  getSubjectConfig,
  getSubjectFallbackQuiz,
  getSubjectFallbackFlashcards,
  getSubjectFallbackAnswer,
  validateSubjectRelevance,
} from '../../utils/subjectTeacherData';

interface AITeacherProps {
  selectedLanguage: LanguageCode;
}

export const AITeacher: React.FC<AITeacherProps> = ({ selectedLanguage }) => {
  const tts = useMultilingualTTS();
  const [activeTab, setActiveTab] = useState<'ask' | 'quiz' | 'flashcards'>('ask');
  const [subject, setSubject] = useState<string>('Computer Science');
  const [grade, setGrade] = useState<string>('Matric (Class 9-10)');
  const [queryInput, setQueryInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [copiedAnswer, setCopiedAnswer] = useState<boolean>(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Quiz state
  const [quizTopic, setQuizTopic] = useState<string>('');
  const [quizQuestions, setQuizQuestions] = useState<
    Array<{ question: string; options: string[]; correctIndex: number; explanation: string }>
  >([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState<boolean>(false);

  // Flashcards state
  const [flashcardTopic, setFlashcardTopic] = useState<string>('');
  const [flashcards, setFlashcards] = useState<
    Array<{ front: string; back: string; category?: string; notes?: string }>
  >([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);

  const currentConfig = getSubjectConfig(subject);

  const handleCopyAnswer = () => {
    if (!answer) return;
    navigator.clipboard.writeText(answer);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  const handleAsk = async (e?: React.FormEvent, directPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToUse = directPrompt || queryInput;
    const trimmed = promptToUse.trim();
    if (!trimmed || isLoading) return;

    if (directPrompt) {
      setQueryInput(directPrompt);
    }

    setValidationWarning(null);

    const cacheKey = `${selectedLanguage}_${subject}_${grade}_${trimmed.toLowerCase()}`;
    const cached = teacherQueryCache.get(cacheKey);
    if (cached) {
      setAnswer(cached);
      return;
    }

    setIsLoading(true);
    setAnswer(null);

    try {
      const res = await fetch('/api/teacher/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          subject,
          grade,
          language: selectedLanguage,
        }),
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      let answerText = data.answer || data.explanation || data.text || '';

      // Validate relevance to selected subject
      const relevanceCheck = validateSubjectRelevance(answerText, subject, trimmed);
      if (!relevanceCheck.isRelevant) {
        console.warn(`Subject mismatch in AI response: ${relevanceCheck.reason}. Applying syllabus fallback.`);
        answerText = getSubjectFallbackAnswer(subject, grade, trimmed);
      }

      if (!answerText) {
        answerText = getSubjectFallbackAnswer(subject, grade, trimmed);
      }

      teacherQueryCache.set(cacheKey, answerText);
      setAnswer(answerText);
    } catch {
      const fallbackText = getSubjectFallbackAnswer(subject, grade, trimmed);
      setAnswer(fallbackText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQuiz = async (e?: React.FormEvent, customTopic?: string) => {
    if (e) e.preventDefault();
    const topic = (customTopic || quizTopic).trim() || subject;
    setIsLoading(true);
    setQuizQuestions([]);
    setSelectedAnswers({});
    setShowQuizResults(false);

    try {
      const res = await fetch('/api/teacher/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          grade,
          topic,
          numQuestions: 4,
          language: selectedLanguage,
        }),
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      const list = data.questions || data.quizzes;
      if (list && Array.isArray(list) && list.length > 0) {
        // Validate relevance to selected subject
        const combinedText = list.map((q: any) => `${q.question} ${q.explanation || ''}`).join(' ');
        const relevanceCheck = validateSubjectRelevance(combinedText, subject, topic);
        if (!relevanceCheck.isRelevant) {
          console.warn(`Quiz subject mismatch: ${relevanceCheck.reason}. Applying syllabus fallback.`);
          setQuizQuestions(getSubjectFallbackQuiz(subject, topic));
        } else {
          setQuizQuestions(list);
        }
      } else {
        throw new Error('Invalid quiz response');
      }
    } catch {
      setQuizQuestions(getSubjectFallbackQuiz(subject, topic));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFlashcards = async (e?: React.FormEvent, customTopic?: string) => {
    if (e) e.preventDefault();
    const topic = (customTopic || flashcardTopic).trim() || subject;
    setIsLoading(true);
    setFlashcards([]);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);

    try {
      const res = await fetch('/api/teacher/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          grade,
          topic,
          numCards: 5,
          language: selectedLanguage,
        }),
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (data.flashcards && Array.isArray(data.flashcards) && data.flashcards.length > 0) {
        // Validate relevance to selected subject
        const combinedText = data.flashcards.map((f: any) => `${f.front} ${f.back} ${f.notes || ''}`).join(' ');
        const relevanceCheck = validateSubjectRelevance(combinedText, subject, topic);
        if (!relevanceCheck.isRelevant) {
          console.warn(`Flashcard subject mismatch: ${relevanceCheck.reason}. Applying syllabus fallback.`);
          setFlashcards(getSubjectFallbackFlashcards(subject, topic));
        } else {
          setFlashcards(data.flashcards);
        }
      } else {
        throw new Error('Invalid flashcard response');
      }
    } catch {
      setFlashcards(getSubjectFallbackFlashcards(subject, topic));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
            Curriculum & Academic Teacher
          </h1>
          <p className="text-[var(--text-muted)] text-xs sm:text-sm">
            FBISE and provincial board aligned concept explainer, quiz generator, and interactive revision flashcards.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-[var(--surface)] border border-[var(--border)] p-1 rounded-lg self-start sm:self-auto shadow-xs">
          <button
            onClick={() => setActiveTab('ask')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'ask'
                ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Ask Teacher
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'quiz'
                ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Quiz Me
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'flashcards'
                ? 'bg-[var(--surface-hover)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Flashcards
          </button>
        </div>
      </div>

      {/* Subject & Grade Filter Card */}
      <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              Subject:
            </label>
            <div className="relative">
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setQueryInput('');
                  setAnswer(null);
                  setQuizQuestions([]);
                  setFlashcards([]);
                }}
                className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs font-semibold text-[var(--input-text)] focus:outline-none focus:border-[var(--focus-ring)] cursor-pointer"
              >
                {Object.values(SUBJECT_CONFIGS).map((s) => (
                  <option key={s.name} value={s.name} className="bg-[var(--surface)] text-[var(--text-primary)]">
                    {s.icon} {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              Academic Level:
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full p-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs font-semibold text-[var(--input-text)] focus:outline-none focus:border-[var(--focus-ring)] cursor-pointer"
            >
              {GRADES.map((g: string) => (
                <option key={g} value={g} className="bg-[var(--surface)] text-[var(--text-primary)]">
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Context Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border)] text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">{currentConfig.icon}</span>
            <span className="font-semibold text-[var(--text-primary)]">{currentConfig.name}</span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="text-[var(--text-secondary)]">{grade}</span>
            {currentConfig.secondaryVisuals && (
              <div className="hidden md:flex items-center gap-1 pl-1 text-xs opacity-75">
                {currentConfig.secondaryVisuals.slice(0, 4).map((vis: string, vIdx: number) => (
                  <span key={vIdx}>{vis}</span>
                ))}
              </div>
            )}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">
            Content is strictly locked to <strong className="text-[var(--text-primary)] font-semibold">{currentConfig.name}</strong>
          </span>
        </div>
      </div>

      {/* Mode 1: Ask Teacher */}
      {activeTab === 'ask' && (
        <div className="space-y-4">
          <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--text-secondary)] block">
                Ask your question in <span className="font-semibold text-[var(--text-primary)]">{currentConfig.name}</span>:
              </label>
              <span className="text-[10px] font-medium text-[var(--text-muted)]">
                FBISE & Provincial Boards
              </span>
            </div>

            <form onSubmit={(e) => handleAsk(e)} className="flex gap-2">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder={currentConfig.placeholderPrompt}
                className="flex-1 p-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--focus-ring)]"
              />
              <button
                type="submit"
                disabled={isLoading || !queryInput.trim()}
                className="px-4 py-2.5 bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:opacity-90 disabled:opacity-40 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-opacity cursor-pointer shrink-0 shadow-xs"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="hidden sm:inline">Ask Teacher</span>
              </button>
            </form>

            {/* Quick syllabus prompt chips */}
            <div className="pt-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                Suggested {currentConfig.name} topics:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentConfig.quickPrompts.map((prompt: string, pIdx: number) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => handleAsk(undefined, prompt)}
                    disabled={isLoading}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer text-left font-medium"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {answer && (
            <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)] space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currentConfig.icon}</span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
                      {currentConfig.name} Explanation
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Level: {grade} • Relatable examples & board exam format
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyAnswer}
                    type="button"
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    title="Copy full lesson"
                  >
                    {copiedAnswer ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <SpeechPlayerControls
                    id="teacher-explanation-result"
                    speakingId={tts.speakingId}
                    playState={tts.playState}
                    voiceError={tts.voiceError}
                    activeLangName={tts.activeLangName}
                    currentChunkIndex={tts.currentChunkIndex}
                    totalChunks={tts.totalChunks}
                    onPlay={() => tts.play('teacher-explanation-result', answer, selectedLanguage)}
                    onPause={tts.pause}
                    onResume={tts.resume}
                    onStop={tts.stop}
                    onClearError={tts.clearError}
                  />
                </div>
              </div>

              {/* Render with EducationalMarkdown so NO raw ###, **, or * are visible */}
              <EducationalMarkdown
                content={answer}
                subjectIcon={currentConfig.icon}
                className="pt-1"
              />
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Interactive Quiz */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--text-secondary)] block">
                Practice quiz topic for <span className="font-semibold text-[var(--text-primary)]">{currentConfig.name}</span>:
              </label>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">
                4 Multiple Choice Questions
              </span>
            </div>

            <form onSubmit={(e) => handleGenerateQuiz(e)} className="flex gap-2">
              <input
                type="text"
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
                placeholder={`e.g. ${currentConfig.quickPrompts[0]} or ${currentConfig.name}`}
                className="flex-1 p-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--focus-ring)]"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2.5 bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:opacity-90 disabled:opacity-40 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-opacity cursor-pointer shrink-0 shadow-xs"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                <span>Generate Quiz</span>
              </button>
            </form>

            {/* Topic recommendation chips */}
            <div className="pt-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                Suggested quiz topics:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentConfig.quickPrompts.slice(0, 3).map((prompt: string, pIdx: number) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => {
                      setQuizTopic(prompt);
                      handleGenerateQuiz(undefined, prompt);
                    }}
                    disabled={isLoading}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer text-left font-medium"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {quizQuestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  {currentConfig.icon} {subject} Quiz • {quizQuestions.length} Questions
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Select your answers and click Check Answers below
                </span>
              </div>

              {showQuizResults && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between shadow-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      Quiz Score: {quizQuestions.filter((q, i) => selectedAnswers[i] === q.correctIndex).length} of {quizQuestions.length} Correct
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                    {Math.round((quizQuestions.filter((q, i) => selectedAnswers[i] === q.correctIndex).length / quizQuestions.length) * 100)}%
                  </span>
                </div>
              )}

              {quizQuestions.map((q, qIdx) => {
                const selectedOpt = selectedAnswers[qIdx];
                return (
                  <div
                    key={qIdx}
                    className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)] space-y-3 shadow-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] font-semibold text-xs flex items-center justify-center shrink-0">
                        {qIdx + 1}
                      </span>
                      <h4 className="text-xs sm:text-sm font-medium text-[var(--text-primary)] leading-snug">
                        {q.question}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-7">
                      {q.options.map((opt, optIdx) => {
                        const isChosen = selectedOpt === optIdx;
                        const isCorrect = optIdx === q.correctIndex;
                        let btnStyle =
                          'border-[var(--border)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]';

                        if (showQuizResults) {
                          if (isCorrect) {
                            btnStyle = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold';
                          } else if (isChosen && !isCorrect) {
                            btnStyle = 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400';
                          }
                        } else if (isChosen) {
                          btnStyle = 'border-[var(--accent)] bg-[var(--surface-hover)] text-[var(--text-primary)] font-medium';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => {
                              if (!showQuizResults) {
                                setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
                              }
                            }}
                            className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {showQuizResults && isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                            {showQuizResults && isChosen && !isCorrect && <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {showQuizResults && (
                      <div className="pl-7 pt-1">
                        <div className="p-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-secondary)] space-y-1">
                          <span className="font-semibold text-[var(--text-primary)] block">Explanation:</span>
                          <EducationalMarkdown content={q.explanation} mode="inline" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex justify-end gap-2 pt-1">
                {!showQuizResults ? (
                  <button
                    onClick={() => setShowQuizResults(true)}
                    className="px-4 py-2 bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:opacity-90 rounded-lg text-xs font-semibold transition-opacity cursor-pointer shadow-xs"
                  >
                    Check All Answers
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowQuizResults(false);
                      setSelectedAnswers({});
                    }}
                    className="px-4 py-2 bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Quiz</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Flashcards */}
      {activeTab === 'flashcards' && (
        <div className="space-y-4">
          <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--text-secondary)] block">
                Generate Quick Revision Flashcards for <span className="font-semibold text-[var(--text-primary)]">{currentConfig.name}</span>:
              </label>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">
                High-Yield Memory Cards
              </span>
            </div>

            <form onSubmit={(e) => handleGenerateFlashcards(e)} className="flex gap-2">
              <input
                type="text"
                value={flashcardTopic}
                onChange={(e) => setFlashcardTopic(e.target.value)}
                placeholder={`e.g. ${currentConfig.quickPrompts[0]} or ${currentConfig.name} key definitions`}
                className="flex-1 p-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--focus-ring)]"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2.5 bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:opacity-90 disabled:opacity-40 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition-opacity cursor-pointer shrink-0 shadow-xs"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                <span>Create Flashcards</span>
              </button>
            </form>

            {/* Quick flashcard topic chips */}
            <div className="pt-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                Suggested flashcard sets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentConfig.quickPrompts.slice(0, 3).map((prompt: string, pIdx: number) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => {
                      setFlashcardTopic(prompt);
                      handleGenerateFlashcards(undefined, prompt);
                    }}
                    disabled={isLoading}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer text-left font-medium"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {flashcards.length > 0 && (
            <div className="max-w-xl mx-auto space-y-3">
              {/* Flashcard item */}
              <div
                onClick={() => setIsCardFlipped(!isCardFlipped)}
                className="min-h-56 p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] cursor-pointer flex flex-col justify-between transition-all duration-200 shadow-sm"
              >
                <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{currentConfig.icon}</span>
                    <span className="font-medium text-[var(--text-secondary)]">{flashcards[currentCardIndex].category || subject}</span>
                    <span>•</span>
                    <span>Card {currentCardIndex + 1} of {flashcards.length}</span>
                  </div>
                  <span className="bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-secondary)] px-2 py-0.5 rounded text-[11px]">
                    {isCardFlipped ? 'Answer (Tap to flip back)' : 'Question (Tap to reveal answer)'}
                  </span>
                </div>

                <div className="my-auto text-center py-4 px-2">
                  <div className="text-sm sm:text-base md:text-lg font-semibold leading-relaxed text-[var(--text-primary)]">
                    <EducationalMarkdown
                      content={isCardFlipped ? flashcards[currentCardIndex].back : flashcards[currentCardIndex].front}
                      mode="inline"
                    />
                  </div>
                  {isCardFlipped && flashcards[currentCardIndex].notes && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--text-muted)] text-left">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <EducationalMarkdown content={flashcards[currentCardIndex].notes} mode="inline" />
                    </div>
                  )}
                </div>

                <div className="text-center text-[11px] text-[var(--text-muted)]">
                  Tap anywhere on the card to flip
                </div>
              </div>

              {/* Navigation controls */}
              <div className="flex items-center justify-between pt-1">
                <button
                  disabled={currentCardIndex === 0}
                  onClick={() => {
                    setCurrentCardIndex((c) => Math.max(0, c - 1));
                    setIsCardFlipped(false);
                  }}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] disabled:opacity-40 text-xs font-semibold cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs text-[var(--text-muted)]">
                  {currentCardIndex + 1} / {flashcards.length}
                </span>
                <button
                  disabled={currentCardIndex === flashcards.length - 1}
                  onClick={() => {
                    setCurrentCardIndex((c) => Math.min(flashcards.length - 1, c + 1));
                    setIsCardFlipped(false);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:opacity-90 disabled:opacity-40 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
