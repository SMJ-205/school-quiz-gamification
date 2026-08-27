'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { isAudioMuted, toggleAudioMute } from '@/lib/audioEngine';

export default function PixelProgressBar() {
  const { questions, currentQuestionIndex, score, metadata, correctAnswersCount } = useGameStore();
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isAudioMuted());
  }, []);

  function handleToggleSound() {
    const isNowMuted = toggleAudioMute();
    setMuted(isNowMuted);
  }

  const total = questions.length;
  const current = currentQuestionIndex + 1;
  const pct = total > 0 ? (currentQuestionIndex / total) * 100 : 0;

  return (
    <div className="w-full bg-[#18110B] border-b-4 border-[#3D2516] px-3 sm:px-4 py-2 text-stone-200 z-30 shadow-md">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3">

        {/* Left: Level / Subject */}
        <div className="flex items-center gap-2">
          <div className="retro-pill-badge !text-xs !py-1 !px-2.5">
            📚 {metadata?.subject || 'PENGETAHUAN'}
          </div>
          {metadata?.title && (
            <span className="font-dialogue text-base sm:text-lg text-amber-200/80 hidden sm:inline">
              | {metadata.title}
            </span>
          )}
        </div>

        {/* Center: Progress */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-[160px] flex-1 max-w-md">
          <span className="font-dialogue text-base sm:text-lg text-amber-300 whitespace-nowrap">
            SOAL {current}/{total}
          </span>
          <div className="flex-1 h-2.5 sm:h-3 bg-black/60 border border-stone-600 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, pct)}%` }}
            />
          </div>
        </div>

        {/* Right: Score, Correct count, and Sound Mute Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-dialogue text-base sm:text-xl text-amber-400 font-bold">
            ⭐ {score} PTS
          </span>
          <span className="text-xs bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-2 py-0.5 rounded font-dialogue text-sm sm:text-base">
            ✓ {correctAnswersCount}
          </span>

          {/* Sound Toggle Button (🔊 / 🔇) */}
          <button
            onClick={handleToggleSound}
            title={muted ? 'Nyalakan Suara (Unmute)' : 'Matikan Suara (Mute)'}
            className={`p-1.5 px-2.5 rounded-lg border text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1 ${
              muted
                ? 'bg-red-950/60 border-red-500/60 text-red-300 hover:bg-red-900/60'
                : 'bg-amber-950/60 border-amber-500/60 text-amber-300 hover:bg-amber-900/60'
            }`}
          >
            <span>{muted ? '🔇' : '🔊'}</span>
            <span className="hidden sm:inline">{muted ? 'MUTE' : 'BGM'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
