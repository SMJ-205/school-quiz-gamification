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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-4 md:p-8 pointer-events-none">
      {/* Dark overlay backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs pointer-events-auto z-0"
        onClick={onClose}
      />

      {/* Owl Dialogue Card */}
      <div
        ref={ref}
        tabIndex={-1}
        className="relative z-10 pointer-events-auto max-w-md w-full pixel-dialogue-box !border-4 !border-amber-400/80 shadow-2xl animate-fade-in"
      >
        <div className="flex items-start gap-4 mb-3">
          <div className="text-5xl anim-float flex-shrink-0">
            🦉
          </div>
          <div>
            <div className="retro-pill-badge !text-xs !py-0.5 !px-2 text-amber-300 mb-1">
              PENJAGA ARSIP KUNO
            </div>
            <p className="font-dialogue text-xl text-stone-200 leading-tight">
              Jawaban belum tepat, tapi jangan berkecil hati! Bacalah petunjuk ini:
            </p>
          </div>
        </div>

        {/* Hint Box */}
        <div className="bg-amber-950/40 border-2 border-amber-500/40 p-3 rounded-lg mb-4">
          <span className="font-dialogue text-base text-amber-400 font-bold block mb-1">
            💡 PETUNJUK PENGETAHUAN:
          </span>
          <p className="font-dialogue text-2xl text-amber-100 leading-snug">
            {hint || 'Perhatikan kembali kata kunci dan konsep dalam materi pembelajaran.'}
          </p>
        </div>

        {/* Try Again Button */}
        <button
          className="btn-pixel btn-pixel-gold w-full text-base py-3 flex items-center justify-center gap-2"
          onClick={onClose}
        >
          <span>🔄</span>
          <span>COBA LAGI TANPA PENALTI</span>
        </button>
      </div>
    </div>
  );
}
