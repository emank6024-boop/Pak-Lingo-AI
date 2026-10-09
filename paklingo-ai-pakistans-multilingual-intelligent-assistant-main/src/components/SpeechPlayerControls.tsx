import React, { useState } from 'react';
import {
  Volume2,
  Play,
  Pause,
  Square,
  AlertTriangle,
  X,
  Check,
  Loader2,
  Sliders,
} from 'lucide-react';
import { TTSPlayState } from '../utils/speech';
import { VoiceSettingsModal } from './VoiceSettingsModal';
import { useVoiceSettings } from '../context/VoiceSettingsContext';

export interface SpeechPlayerControlsProps {
  id: string;
  speakingId: string | null;
  playState: TTSPlayState;
  voiceError: string | null;
  activeLangName?: string | null;
  currentChunkIndex?: number;
  totalChunks?: number;
  statusMessage?: string | null;
  activeEngine?: 'ai' | 'browser' | null;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onClearError?: () => void;
  variant?: 'inline' | 'bar';
}

export const SpeechPlayerControls: React.FC<SpeechPlayerControlsProps> = ({
  id,
  speakingId,
  playState,
  voiceError,
  activeLangName,
  currentChunkIndex = 0,
  totalChunks = 0,
  statusMessage,
  activeEngine,
  onPlay,
  onPause,
  onResume,
  onStop,
  onClearError,
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { hasUrduVoice, isUrduVoiceUsable } = useVoiceSettings();

  const isThisSpeaking = speakingId === id;
  const isPreparing = isThisSpeaking && playState === 'preparing';
  const isSpeaking = isThisSpeaking && (playState === 'speaking' || playState === 'playing');
  const isPaused = isThisSpeaking && playState === 'paused';
  const isFinished = isThisSpeaking && playState === 'finished';

  return (
    <div className="flex flex-col gap-1.5" id={`tts-control-${id}`}>
      {/* Controls Container */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {!isThisSpeaking || playState === 'idle' ? (
          /* Idle State: Standard "Listen" button + Quick Voice Settings icon */
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPlay}
              className="hover:text-emerald-700 text-neutral-600 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-emerald-50 text-xs font-medium transition-all active:scale-95 cursor-pointer border border-transparent hover:border-emerald-200"
              title="Listen to exact response (Text-to-Speech)"
              id={`btn-listen-${id}`}
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Listen</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Voice Settings (Speed, Pitch, Voice)"
              id={`btn-voice-settings-${id}`}
              aria-label="Voice settings"
            >
              <Sliders className="w-3 h-3" />
            </button>
          </div>
        ) : (
          /* Active States: Preparing, Speaking, Paused, or Finished */
          <div className="flex items-center gap-1.5 bg-emerald-50/90 border border-emerald-300/90 rounded-xl px-2.5 py-1 shadow-2xs">
            {/* 1. Preparing audio status */}
            {isPreparing && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-900 mr-0.5">
                <Loader2 className="w-3 h-3 animate-spin text-emerald-700 shrink-0" />
                <span>Preparing audio...</span>
              </div>
            )}

            {/* 2. Speaking status */}
            {isSpeaking && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-900 mr-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span>Speaking...</span>
                {activeEngine === 'ai' && (
                  <span className="text-[9px] font-bold bg-emerald-200/90 text-emerald-950 px-1 py-0.2 rounded">
                    AI
                  </span>
                )}
                {totalChunks > 1 && (
                  <span className="text-[10px] text-emerald-700 font-normal">
                    [{currentChunkIndex + 1}/{totalChunks}]
                  </span>
                )}
              </div>
            )}

            {/* 3. Paused status */}
            {isPaused && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-900 mr-0.5">
                <span className="inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                <span>Paused</span>
                {totalChunks > 1 && (
                  <span className="text-[10px] text-amber-700 font-normal">
                    [{currentChunkIndex + 1}/{totalChunks}]
                  </span>
                )}
              </div>
            )}

            {/* 4. Finished status */}
            {isFinished && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 mr-0.5">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Finished</span>
              </div>
            )}

            {/* Buttons: Pause while speaking */}
            {isSpeaking && (
              <button
                type="button"
                onClick={onPause}
                className="px-2 py-0.5 rounded bg-white hover:bg-neutral-100 text-emerald-900 text-xs font-medium flex items-center gap-1 border border-emerald-200 transition-colors cursor-pointer"
                title="Pause speech"
                id={`btn-pause-${id}`}
              >
                <Pause className="w-3 h-3 text-emerald-700" />
                <span>Pause</span>
              </button>
            )}

            {/* Buttons: Resume while paused */}
            {isPaused && (
              <button
                type="button"
                onClick={onResume}
                className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="Resume speech"
                id={`btn-resume-${id}`}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Resume</span>
              </button>
            )}

            {/* Re-listen button if finished */}
            {isFinished && (
              <button
                type="button"
                onClick={onPlay}
                className="px-2 py-0.5 rounded bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-medium flex items-center gap-1 border border-emerald-300 transition-colors cursor-pointer"
                title="Listen again"
                id={`btn-listen-again-${id}`}
              >
                <Volume2 className="w-3 h-3 text-emerald-700" />
                <span>Listen</span>
              </button>
            )}

            {/* Stop Button: always available while speaking, paused, or preparing */}
            {(isSpeaking || isPaused || isPreparing) && (
              <button
                type="button"
                onClick={onStop}
                className="px-2 py-0.5 rounded bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 text-xs font-medium flex items-center gap-1 border border-neutral-200 transition-colors cursor-pointer"
                title="Stop speech"
                id={`btn-stop-${id}`}
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            )}

            {/* Settings Quick Access Icon */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="p-1 rounded text-neutral-500 hover:text-neutral-800 hover:bg-white/80 transition-colors cursor-pointer ml-0.5"
              title="Voice Settings"
              aria-label="Voice settings"
            >
              <Sliders className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Small Clean Informational Voice Notice (only if voice is truly unavailable) */}
      {voiceError && !isUrduVoiceUsable && (
        <div
          className="flex items-center justify-between gap-2.5 px-3 py-2 bg-[#0c1633] border border-[#203467] rounded-xl text-slate-200 text-xs animate-in fade-in duration-150 max-w-md shadow-md"
          id={`voice-error-${id}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <p className="text-xs text-slate-300 truncate">{voiceError}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
            >
              Voice Settings
            </button>
            {onClearError && (
              <button
                type="button"
                onClick={onClearError}
                className="text-neutral-400 hover:text-white p-0.5 rounded cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Voice Settings Modal */}
      <VoiceSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
};
