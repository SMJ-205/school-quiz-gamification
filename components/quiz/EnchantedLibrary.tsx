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
  const { currentQuestionIndex, correctAnswersCount, questions, character, studentName, selectedBackground, setScreen, resetGame } = useGameStore();
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
    <div
      className="min-h-screen flex flex-col justify-between relative overflow-hidden select-none bg-[#070503]"
      style={{
        backgroundImage: `url(${selectedBackground || '/backgrounds/library_sunlit.jpg'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 40%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/65 pointer-events-none z-0" />
      <div className="crt-scanlines-overlay" />

      {/* ── TOP HUD BAR (Full Width Edge-to-Edge) ────────────────────────── */}
      <div className="relative z-20 p-2.5 sm:p-3 bg-black/90 border-b-2 border-amber-950 flex items-center justify-between gap-2 font-pixel">
        <div className="flex items-center gap-2">
          <div className="retro-pill-badge !bg-amber-950 !border-amber-400 text-amber-300 text-xs sm:text-sm py-1 px-3 font-bold">
            📖 RAK ARSIP {floorNumber}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExitModal(true)}
            className="btn-pixel !bg-red-950/90 hover:!bg-red-900 !border-red-600/80 text-red-200 text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer shadow-md"
            title="Kembali ke Menu Utama"
          >
            <span>🏠</span>
            <span>MENU UTAMA</span>
          </button>
          <div className="retro-pill-badge !bg-stone-900/90 !border-amber-500/60 text-amber-300 text-xs py-1 px-3 hidden sm:flex">
            ⚔️ KUIS ILMU PERPUSTAKAAN
          </div>
        </div>
      </div>

      {/* ── MAIN ARENA STAGE (Flexible Fill Height) ───────────────────────── */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-between p-3 sm:p-6 pt-12 sm:pt-16 md:pt-20 overflow-y-auto w-full">
        {/* Upper Arena Space: Question & Answers Panel (Clearance ~0.5cm+ below top HUD) */}
        <div className="w-full max-w-4xl sm:max-w-5xl lg:max-w-6xl mx-auto mt-6 sm:mt-10 md:mt-12 mb-auto flex flex-col items-center justify-center px-2">
          <QuestionPanel />
        </div>

        {/* Lower Stage: Student Character Standing on Floor */}
        <div className="w-full max-w-4xl sm:max-w-5xl lg:max-w-6xl mx-auto mt-auto flex items-end justify-between px-2 sm:px-8 pt-4 pb-2">
          {/* Student Sprite on Floor with Name Badge */}
          <div className="flex items-end gap-3 sm:gap-5">
            <PixelSprite character={character} pixelSize={0.65} animate />
            <div className="bg-black/90 border-2 border-amber-500/80 px-4 py-1.5 rounded-xl text-amber-300 font-dialogue text-xl sm:text-2xl shadow-2xl mb-1">
              {studentName || 'Petualang'}
            </div>
          </div>

          {/* Status Alert if Archive Found */}
          <div className="mb-1">
            {archiveOpened ? (
              <div className="bg-amber-950/95 border-2 border-amber-400 text-amber-200 font-dialogue text-xl sm:text-3xl px-5 py-2.5 rounded-xl shadow-2xl animate-bounce">
                ✨ ARSIP TERBUKA! (+100)
              </div>
            ) : (
              <div className="bg-black/85 border-2 border-stone-700 text-stone-300 font-dialogue text-sm sm:text-xl px-4 py-2 rounded-xl hidden sm:block shadow-lg">
                📚 Cari arsip ilmu di rak buku...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM CRT STATUS BAR (Full Width Edge-to-Edge) ───────────────── */}
      <div className="relative z-20 p-2.5 sm:p-3 bg-black/90 border-t-2 border-amber-950 flex items-center justify-between font-pixel text-sm sm:text-base tracking-wider text-stone-300">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-stone-300 font-bold">MENJELAJAH PERPUSTAKAAN</span>
        </div>

        <div className="flex items-center gap-3 text-amber-300 font-bold">
          <span>PROGRES ARSIP:</span>
          <span className="text-white bg-amber-950/80 px-2.5 py-0.5 rounded border border-amber-500/40">
            {correctAnswersCount} / {questions.length}
          </span>
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
                  resetGame();
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
