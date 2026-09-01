'use client';

/**
 * PatternReportModal.tsx
 * Summary Report Modal for "Detektif Pola" (Laboratorium IPA Infinite Mode)
 * Shows performance statistics, accuracy %, category breakdown, and detective ranks.
 */

import React from 'react';
import PixelSprite from '../PixelSprite';
import { CharacterGear } from '@/store/useGameStore';
import { sfxVictory } from '@/lib/audioEngine';

export interface CategoryStats {
  total: number;
  correct: number;
}

export interface PatternReportData {
  totalAnswered: number;
  correctCount: number;
  score: number;
  maxStreak: number;
  categoryBreakdown: Record<string, CategoryStats>;
}

interface PatternReportModalProps {
  studentName: string;
  character: CharacterGear;
  stats: PatternReportData;
  selectedGrade?: number;
  onRetry: () => void;
  onExit: () => void;
}

export default function PatternReportModal({
  studentName,
  character,
  stats,
  selectedGrade = 6,
  onRetry,
  onExit,
}: PatternReportModalProps) {
  React.useEffect(() => {
    sfxVictory();
  }, []);

  const { totalAnswered, correctCount, score, maxStreak, categoryBreakdown } = stats;

  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  // Determine Detective Title
  let rankBadge = '🐣 DETEKTIF POLA PEMULA';
  let rankDesc = `Teruskan berlatih meneliti pola angka dan visual tingkat Kelas ${selectedGrade} SD di laboratorium!`;
  let rankColor = 'border-amber-500 bg-amber-950/80 text-amber-300';

  if (correctCount >= 20 && accuracy >= 85) {
    rankBadge = `👑 MASTER DETEKTIF LOGIKA (SD KELAS ${selectedGrade})`;
    rankDesc = `Luar biasa! Penalaran induktif dan spasialmu setingkat Master Sains Kelas ${selectedGrade} SD!`;
    rankColor = 'border-cyan-400 bg-cyan-950/90 text-cyan-300 animate-pulse';
  } else if (correctCount >= 12 && accuracy >= 70) {
    rankBadge = `🔬 ANALIS INDUKTIF SENIOR (SD KELAS ${selectedGrade})`;
    rankDesc = `Sangat tajam! Kamu mampu memprediksi pola rumit Kelas ${selectedGrade} SD dengan cepat dan tepat.`;
    rankColor = 'border-cyan-400 bg-cyan-950/90 text-cyan-200';
  } else if (correctCount >= 6) {
    rankBadge = `🔍 DETEKTIF POLA HANDAL (SD KELAS ${selectedGrade})`;
    rankDesc = `Hasil yang solid! Kamu sudah memahami dasar-dasar pola kuis Kelas ${selectedGrade} SD.`;
    rankColor = 'border-emerald-400 bg-emerald-950/90 text-emerald-300';
  }

  const categoryNames: Record<string, { label: string; icon: string }> = {
    aritmatika: { label: 'Aritmatika Bertingkat', icon: '🔢' },
    geometris: { label: 'Geometris & Kuadrat', icon: '📐' },
    interleaved: { label: 'Lompat Selang-Seling', icon: '🔀' },
    visual: { label: 'Logika Visual & Rotasi 2D', icon: '🧩' },
    lab_science: { label: 'Deret Sains & Lab', icon: '🧪' },
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 sm:p-5 select-none overflow-y-auto animate-fadeIn backdrop-blur-md">
      <div className="relative w-full max-w-2xl crt-arcade-frame bg-[#120D0A] border-4 border-amber-600/90 rounded-2xl p-4 sm:p-7 shadow-2xl text-stone-100 flex flex-col items-center my-auto">
        
        {/* Top Header Badge */}
        <div className="mb-2 sm:mb-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
            <div className="retro-pill-badge !bg-cyan-950 !border-cyan-400 text-cyan-300 inline-flex items-center gap-1.5 !text-xs sm:!text-sm">
              <span>🔬</span>
              <span>LABORATORIUM IPA • SUMMARY REPORT</span>
            </div>
            <div className="retro-pill-badge !bg-amber-950 !border-amber-400 text-amber-300 inline-flex items-center gap-1.5 !text-xs sm:!text-sm font-bold">
              <span>🏫</span>
              <span>TINGKAT: KELAS {selectedGrade} SD</span>
            </div>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-amber-300 drop-shadow-[0_2px_8px_rgba(255,179,0,0.5)]">
            LAPORAN DETEKTIF POLA
          </h2>
          <p className="font-dialogue text-stone-300 text-base sm:text-xl mt-1">
            Evaluasi Penalaran Induktif & Spasial — <span className="text-amber-300 font-bold">{studentName || 'Petualang'}</span>
          </p>
        </div>

        {/* Detective Rank Title Badge */}
        <div className={`w-full p-3 sm:p-4 rounded-xl border-2 mb-4 text-center shadow-lg ${rankColor}`}>
          <div className="text-xs sm:text-sm font-bold tracking-widest uppercase mb-0.5">PANGKAT & GELAR DETEKTIF</div>
          <div className="text-xl sm:text-2xl font-black">{rankBadge}</div>
          <p className="font-dialogue text-sm sm:text-lg mt-1 text-stone-200 leading-snug">{rankDesc}</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full mb-4">
          <div className="bg-stone-900/90 border-2 border-stone-700 p-2.5 sm:p-3 rounded-xl text-center">
            <div className="text-[10px] sm:text-xs text-stone-400 font-bold uppercase">TOTAL SOAL</div>
            <div className="text-xl sm:text-3xl font-black text-amber-300">{totalAnswered}</div>
            <div className="text-[10px] sm:text-xs text-stone-400 font-dialogue">Soal Dijawab</div>
          </div>

          <div className="bg-stone-900/90 border-2 border-emerald-600/80 p-2.5 sm:p-3 rounded-xl text-center">
            <div className="text-[10px] sm:text-xs text-emerald-400 font-bold uppercase">BENAR</div>
            <div className="text-xl sm:text-3xl font-black text-emerald-300">{correctCount}</div>
            <div className="text-[10px] sm:text-xs text-emerald-400 font-dialogue">Akurasi {accuracy}%</div>
          </div>

          <div className="bg-stone-900/90 border-2 border-amber-600/80 p-2.5 sm:p-3 rounded-xl text-center">
            <div className="text-[10px] sm:text-xs text-amber-400 font-bold uppercase">TOTAL POIN</div>
            <div className="text-xl sm:text-3xl font-black text-amber-200">+{score}</div>
            <div className="text-[10px] sm:text-xs text-amber-400 font-dialogue">Poin Detektif</div>
          </div>

          <div className="bg-stone-900/90 border-2 border-cyan-600/80 p-2.5 sm:p-3 rounded-xl text-center">
            <div className="text-[10px] sm:text-xs text-cyan-400 font-bold uppercase">REKOR STREAK</div>
            <div className="text-xl sm:text-3xl font-black text-cyan-300">⚡ {maxStreak}</div>
            <div className="text-[10px] sm:text-xs text-cyan-400 font-dialogue">Beruntun</div>
          </div>
        </div>

        {/* Category Breakdown Progress */}
        <div className="w-full bg-stone-950/80 border-2 border-stone-800 rounded-xl p-3 sm:p-4 mb-5 text-left">
          <h4 className="text-xs sm:text-sm font-bold text-amber-400 tracking-wider mb-2.5 uppercase flex items-center gap-1.5">
            <span>📊</span>
            <span>ANALISIS PER KATEGORI POLA</span>
          </h4>

          <div className="space-y-2 text-xs sm:text-sm">
            {Object.entries(categoryNames).map(([key, info]) => {
              const catStat = categoryBreakdown[key] || { total: 0, correct: 0 };
              const catPct = catStat.total > 0 ? Math.round((catStat.correct / catStat.total) * 100) : 0;

              return (
                <div key={key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-stone-300 font-dialogue">
                    <span className="flex items-center gap-1.5 font-bold">
                      <span>{info.icon}</span>
                      <span>{info.label}</span>
                    </span>
                    <span className="text-amber-300 font-mono">
                      {catStat.correct}/{catStat.total} ({catPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden border border-stone-700">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${catPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Guru Lab Feedback & Student Character */}
        <div className="w-full bg-amber-950/40 border-2 border-amber-800/60 rounded-xl p-3 sm:p-4 mb-6 flex items-center gap-3">
          <div className="shrink-0 hidden sm:block">
            <PixelSprite character={character} pixelSize={0.25} />
          </div>

          <div className="flex-1 font-dialogue text-sm sm:text-lg text-stone-200 leading-snug">
            <span className="text-amber-300 font-bold">Guru Lab:</span> “Kemampuan pengamatan pola adalah fondasi utama berpikir ilmiah. Pertahankan rasa ingin tahu ini!”
          </div>

          <div className="shrink-0 relative w-12 h-16 sm:w-14 sm:h-20 flex items-end justify-center">
            <img
              src="/sprites/teacher_lab_idle.png"
              alt="Guru Lab"
              className="w-full h-full object-contain object-bottom select-none pointer-events-none"
              style={{
                imageRendering: 'pixelated',
                filter: [
                  'drop-shadow(1px 0px 0px rgba(6,182,212,0.85))',
                  'drop-shadow(-1px 0px 0px rgba(6,182,212,0.85))',
                  'drop-shadow(0px 1px 0px rgba(6,182,212,0.85))',
                  'drop-shadow(0px -1px 0px rgba(6,182,212,0.85))',
                  'drop-shadow(0px 8px 16px rgba(0,0,0,0.8))',
                ].join(' '),
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onRetry}
            className="btn-pixel btn-pixel-gold w-full sm:w-auto px-6 py-3 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>🔄</span>
            <span>MAIN LAGI (RESET SESI)</span>
          </button>

          <button
            onClick={onExit}
            className="btn-pixel !bg-stone-800 hover:!bg-stone-700 !border-stone-600 text-stone-200 w-full sm:w-auto px-6 py-3 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>🏠</span>
            <span>KEMBALI KE TEMPAT BELAJAR</span>
          </button>
        </div>

      </div>
    </div>
  );
}
