'use client';

import React, { useEffect, useRef } from 'react';
import { sfxOwlHoot } from '@/lib/audioEngine';

interface GuardianOwlModalProps {
  hint: string;
  onClose: () => void;
}

export default function GuardianOwlModal({ hint, onClose }: GuardianOwlModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sfxOwlHoot();
    ref.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none select-none">
      {/* Dark overlay backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs pointer-events-auto z-40"
        onClick={onClose}
      />

      {/* Owl Dialogue Card (Centered, bounded height, zero bottom overlap) */}
      <div
        ref={ref}
        tabIndex={-1}
        className="relative z-50 pointer-events-auto max-w-md w-full max-h-[85vh] overflow-y-auto pixel-dialogue-box !border-4 !border-amber-400 shadow-2xl animate-fade-in p-4 sm:p-6 my-auto"
      >
        {/* Owl Avatar Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-3">
          <div className="text-4xl sm:text-5xl anim-float flex-shrink-0">
            🦉
          </div>
          <div>
            <div className="retro-pill-badge !text-xs !py-0.5 !px-2 text-amber-300 mb-1">
              PENJAGA ARSIP KUNO
            </div>
            <p className="font-dialogue text-lg sm:text-xl text-stone-200 leading-tight">
              Jawaban belum tepat, tapi jangan berkecil hati! Bacalah petunjuk ini:
            </p>
          </div>
        </div>

        {/* Hint Content Box */}
        <div className="bg-amber-950/60 border-2 border-amber-500/50 p-3.5 sm:p-4 rounded-lg mb-4 shadow-inner">
          <span className="font-dialogue text-sm sm:text-base text-amber-400 font-bold block mb-1">
            💡 PETUNJUK PENGETAHUAN:
          </span>
          <p className="font-dialogue text-xl sm:text-2xl text-amber-100 leading-snug whitespace-pre-line break-words">
            {hint || 'Perhatikan kembali kata kunci dan konsep dalam materi pembelajaran.'}
          </p>
        </div>

        {/* Try Again Button */}
        <button
          className="btn-pixel btn-pixel-gold w-full text-sm sm:text-base py-3 sm:py-3.5 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          onClick={onClose}
        >
          <span>🔄</span>
          <span>COBA LAGI TANPA PENALTI</span>
        </button>
      </div>
    </div>
  );
}
