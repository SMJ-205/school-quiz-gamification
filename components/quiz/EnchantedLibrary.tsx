'use client';

/**
 * EnchantedLibrary.tsx
 * Atmospheric retro RPG library quiz arena.
 * Uses the cozy library illustration (/backgrounds/library_bg.jpg) with zero visual glitches or layout jumps.
 * Fully mobile responsive.
 */

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import PixelProgressBar from '../PixelProgressBar';
import QuestionPanel from './QuestionPanel';
import PixelSprite from '../PixelSprite';
import { sfxArchiveUnlock } from '@/lib/audioEngine';

export default function EnchantedLibrary() {
  const { currentQuestionIndex, correctAnswersCount, questions, character, studentName, selectedBackground, setScreen } = useGameStore();
  const [archiveOpened, setArchiveOpened] = useState(false);
  const [prevCorrect, setPrevCorrect] = useState(correctAnswersCount);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    if (correctAnswersCount > prevCorrect) {
      setArchiveOpened(true);
      sfxArchiveUnlock();
    }
    setPrevCorrect(correctAnswersCount);
  }, [correctAnswersCount, prevCorrect]);

  useEffect(() => {
    setArchiveOpened(false);
  }, [currentQuestionIndex]);

  const floorNumber = Math.min(6, Math.floor(currentQuestionIndex / 2) + 1);

  return (
    <div className="min-h-screen flex flex-col bg-[#070503]">
      {/* Top Global Progress Bar (Mobile Responsive) */}
      <PixelProgressBar />

      {/* Main Game Screen Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6">
        <div className="w-full max-w-5xl crt-arcade-frame bg-[#140E0A] flex flex-col relative overflow-hidden shadow-2xl border-2 sm:border-4 border-[#5A3110]">

          {/* CRT Top Bar */}
          <div className="p-2 sm:p-4 flex items-center justify-between border-b-2 border-amber-950/80 bg-black/75 backdrop-blur-sm z-20 gap-2">
            <div className="flex items-center gap-2">
              <div className="retro-pill-badge !bg-amber-950 !border-amber-400 text-amber-300 !text-[10px] sm:!text-xs !py-1 !px-2.5">
                📖 RAK ARSIP {floorNumber}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowExitModal(true)}
                className="btn-pixel !bg-red-950/90 hover:!bg-red-900 !border-red-600/80 text-red-200 !text-[10px] sm:!text-xs !py-1 !px-2.5 flex items-center gap-1 cursor-pointer"
                title="Kembali ke Menu Utama"
              >
                <span>🏠</span>
                <span>MENU UTAMA</span>
              </button>
              <div className="retro-pill-badge !bg-stone-900/90 !border-amber-500/60 text-amber-300 !text-[10px] sm:!text-xs !py-1 !px-2.5">
                ⚔️ KUIS ILMU
              </div>
            </div>
          </div>

          {/* Library Arena Stage with Dynamic Background */}
          <div
            className="relative w-full min-h-[460px] md:min-h-[520px] flex flex-col justify-between p-3 sm:p-6 overflow-hidden"
            style={{
              backgroundImage: `url(${selectedBackground || '/backgrounds/library_sunlit.jpg'})`,
              backgroundPosition: 'center 40%',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* Subtle Warm Atmospheric Lighting Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/60 pointer-events-none z-0" />

            {/* Upper Arena Space: Question & Answers Panel */}
            <div className="relative z-20 w-full max-w-3xl mx-auto pt-6 sm:pt-8 mb-2">
              <QuestionPanel />
            </div>

            {/* Lower Stage: Student Character Standing on Floor */}
            <div className="relative z-10 w-full mt-auto flex items-end justify-between px-2 sm:px-6 pt-2">
              {/* Student Sprite on Floor with Name Badge */}
              <div className="flex items-end gap-2 sm:gap-3">
                <PixelSprite
                  character={character}
                  pixelSize={0.38}
                  animate
                />
                <div className="bg-black/80 border border-amber-500/50 px-2.5 py-1 rounded-lg text-amber-300 font-dialogue text-base sm:text-lg shadow-lg mb-1">
                  {studentName || 'Petualang'}
                </div>
              </div>

              {/* Status Alert if Archive Found */}
              <div className="mb-1">
                {archiveOpened ? (
                  <div className="bg-amber-950/90 border-2 border-amber-400 text-amber-200 font-dialogue text-base sm:text-xl px-3 py-1.5 rounded-lg shadow-xl">
                    ✨ ARSIP TERBUKA! (+100)
                  </div>
                ) : (
                  <div className="bg-black/60 border border-stone-700 text-stone-300 font-dialogue text-xs sm:text-base px-2.5 py-1 rounded-lg hidden sm:block">
                    📚 Cari arsip ilmu di rak buku...
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* CRT Bottom Bar */}
          <div className="p-2 sm:p-3 flex items-center justify-between border-t-2 border-amber-950/80 bg-black/80 z-20 font-dialogue text-base sm:text-xl tracking-wider text-stone-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-stone-300 text-xs sm:text-base">MENJELAJAH</span>
            </div>

            <div className="flex items-center gap-2 text-amber-300 text-xs sm:text-base">
              <span>ARSIP:</span>
              <span className="text-white font-bold">{correctAnswersCount}/{questions.length}</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── Exit Confirmation Modal ────────────────────────────────────────────────── */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-5 select-none animate-fadeIn">
          <div className="relative w-full max-w-md crt-arcade-frame bg-[#140a0a] border-4 border-red-600 rounded-2xl p-5 sm:p-6 shadow-2xl text-stone-100 font-pixel text-center">
            {/* Warning Icon & Badge */}
            <div className="inline-block bg-red-950 border-2 border-red-500 text-red-300 font-bold text-xs px-3 py-1 rounded-full mb-3 shadow uppercase tracking-widest">
              ⚠️ KONFIRMASI KEMBALI
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-red-400 mb-2 leading-tight">
              KEMBALI KE MENU UTAMA?
            </h3>

            <p className="font-dialogue text-base sm:text-lg text-stone-300 mb-6 leading-relaxed">
              Apakah kamu yakin akan mengakhiri kuis? Semua progres di sesi ini akan hilang.
            </p>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="btn-pixel !bg-stone-800 hover:!bg-stone-700 !border-stone-600 text-stone-200 px-5 py-2.5 text-xs sm:text-sm font-bold w-full sm:w-auto cursor-pointer"
              >
                <span>✕</span>
                <span>BATAL (LANJUT KUIS)</span>
              </button>

              <button
                onClick={() => {
                  setShowExitModal(false);
                  setScreen('background_select');
                }}
                className="btn-pixel !bg-red-900 hover:!bg-red-800 !border-red-600 text-red-200 px-5 py-2.5 text-xs sm:text-sm font-bold w-full sm:w-auto cursor-pointer"
              >
                <span>🏠</span>
                <span>YA, KELUAR</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
