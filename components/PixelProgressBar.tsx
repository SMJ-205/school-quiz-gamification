'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { isBgmMuted, toggleBgmMute, isSfxMuted, toggleSfxMute } from '@/lib/audioEngine';

export default function PixelProgressBar() {
  const { questions, currentQuestionIndex, score, metadata, correctAnswersCount } = useGameStore();
  const [bgmMuted, setBgmMutedState] = useState(false);
  const [sfxMuted, setSfxMutedState] = useState(false);

  useEffect(() => {
    setBgmMutedState(isBgmMuted());
    setSfxMutedState(isSfxMuted());
  }, []);

  function handleToggleBgm() {
    const isNowMuted = toggleBgmMute();
    setBgmMutedState(isNowMuted);
  }

  function handleToggleSfx() {
    const isNowMuted = toggleSfxMute();
    setSfxMutedState(isNowMuted);
  }

  const total = questions.length;
  const current = currentQuestionIndex + 1;
  const pct = total > 0 ? (currentQuestionIndex / total) * 100 : 0;

  return (
    <div className="w-full bg-[#18110B] border-b-4 border-[#3D2516] px-2.5 sm:px-4 py-2 text-stone-200 z-30 shadow-md">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3">

        {/* Left: Level / Subject */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="retro-pill-badge !text-xs !py-0.5 sm:!py-1 !px-2 sm:!px-2.5">
            📚 {metadata?.subject || 'PENGETAHUAN'}
          </div>
          {metadata?.title && (
            <span className="font-dialogue text-sm sm:text-lg text-amber-200/80 hidden sm:inline">
              | {metadata.title}
            </span>
          )}
        </div>

        {/* Center: Progress */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-[130px] sm:min-w-[160px] flex-1 max-w-md">
          <span className="font-dialogue text-xs sm:text-lg text-amber-300 whitespace-nowrap">
            SOAL {current}/{total}
          </span>
          <div className="flex-1 h-2.5 sm:h-3 bg-black/60 border border-stone-600 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, pct)}%` }}
            />
          </div>
        </div>

        {/* Right: Score, Correct count, and Separate BGM & SFX Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="font-dialogue text-sm sm:text-xl text-amber-400 font-bold">
            ⭐ {score}
          </span>
          <span className="text-xs bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-1.5 sm:px-2 py-0.5 rounded font-dialogue text-xs sm:text-base">
            ✓ {correctAnswersCount}
          </span>

          {/* 1. BGM Music Toggle (🎵 / 🔇) */}
          <button
            onClick={handleToggleBgm}
            title={bgmMuted ? 'Nyalakan Musik Latar (BGM ON)' : 'Matikan Musik Latar (BGM MUTE)'}
            className={`p-1 sm:p-1.5 px-2 sm:px-2.5 rounded border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow ${
              bgmMuted
                ? 'bg-stone-900 border-stone-600 text-stone-400 hover:bg-stone-800'
                : 'bg-amber-950/80 border-amber-500/60 text-amber-300 hover:bg-amber-900/80'
            }`}
          >
            <span>{bgmMuted ? '🔇' : '🎵'}</span>
            <span className="text-[10px] sm:text-xs">BGM</span>
          </button>

          {/* 2. SFX Sound Effects Toggle (🔊 / 🔇) */}
          <button
            onClick={handleToggleSfx}
            title={sfxMuted ? 'Nyalakan Efek Suara (SFX ON)' : 'Matikan Efek Suara (SFX MUTE)'}
            className={`p-1 sm:p-1.5 px-2 sm:px-2.5 rounded border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow ${
              sfxMuted
                ? 'bg-stone-900 border-stone-600 text-stone-400 hover:bg-stone-800'
                : 'bg-teal-950/80 border-teal-500/60 text-teal-300 hover:bg-teal-900/80'
            }`}
          >
            <span>{sfxMuted ? '🔇' : '🔊'}</span>
            <span className="text-[10px] sm:text-xs">SFX</span>
          </button>
        </div>

      </div>
    </div>
  );
}
