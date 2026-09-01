'use client';

/**
 * LabInfiniteArena.tsx
 * Laboratorium IPA - Infinite Quiz Mode "Detektif Pola" (Pattern & Sequence Predictor)
 * Features:
 * - Endless procedural pattern question generation
 * - Guru Lab animated sprite with speech typewriter mouth flap sync
 * - Options grid (A, B, C, D) with immediate feedback and explanation hint
 * - Top bar with streak indicator & manual "AKHIRI SESI & LIHAT LAPORAN" trigger button
 * - Summary Report modal (PatternReportModal) upon manual session finish
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import {
  generateNextPatternQuestion,
  PatternQuestion,
  PatternCategory,
} from '@/lib/patternGenerator';
import PatternReportModal, { PatternReportData } from './PatternReportModal';
import GuardianOwlModal from './GuardianOwlModal';
import PixelSprite from '../PixelSprite';
import VisualMatrixDisplay from './VisualMatrixDisplay';
import {
  sfxCorrect,
  sfxWrong,
  sfxTextBlip,
  sfxArchiveUnlock,
  sfxPageTurn,
} from '@/lib/audioEngine';

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

/**
 * ─── CONFIG ANIMASI MULUT & KARAKTER GURU LAB ───────────────────────────────
 * Ubah nilai di bawah ini untuk menyesuaikan ukuran sprite & animasi mulut Guru Lab:
 */
export const GURU_LAB_CONFIG = {
  // Ukuran Skala Sprite Guru Lab (1.2x = 120% lebih besar)
  spriteScale: 1.01,

  // Posisi relatif mulut pada gambar sprite Guru Lab (%)
  mouthPosition: {
    left: '44.2%',   // Sumbu X (Posisi horizontal mulut dari kiri)
    bottom: '67.4%', // Sumbu Y (Posisi vertikal mulut dari bawah)
  },

  // Dimensi Mulut saat Berbicara (Terbuka vs Tertutup)
  mouthDimensions: {
    // Saat mulut TERBUKA (Mouth Open - ketika mengetik teks suara)
    openWidth: '7%',
    openHeight: '2.5%',
    openColor: 'rgba(20, 5, 5, 0.95)', // Warna rongga mulut terbuka

    // Saat mulut TERTUTUP (Mouth Closed - saat spasi & tanda baca)
    closedWidth: '5%',
    closedHeight: '1%',
    closedColor: 'rgba(25, 24, 24, 0.85)', // Warna bibir/garis mulut

    // Kecepatan Transisi Animasi (ms)
    transitionSpeed: '55ms',
  },
};

export default function LabInfiniteArena() {
  const { studentName, character, setScreen, resetGame } = useGameStore();

  // Grade selection state
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [showGradeModal, setShowGradeModal] = useState<boolean>(true);

  // Infinite Session State (Starts at Question 1)
  const [questionCount, setQuestionCount] = useState<number>(1);
  const [currentQuestion, setCurrentQuestion] = useState<PatternQuestion | null>(null);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);

  // Category statistics tracking
  const [categoryBreakdown, setCategoryBreakdown] = useState<
    Record<string, { total: number; correct: number }>
  >({
    aritmatika: { total: 0, correct: 0 },
    geometris: { total: 0, correct: 0 },
    interleaved: { total: 0, correct: 0 },
    visual: { total: 0, correct: 0 },
    lab_science: { total: 0, correct: 0 },
  });

  // Question Interaction State
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [showOwl, setShowOwl] = useState<boolean>(false);

  // Session Fingerprint History Tracking (Zero Duplicate Guarantee)
  const usedQuestionKeysRef = useRef<Set<string>>(new Set());

  // Modals
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  // Confirm Grade Selection and start tailored session
  function handleConfirmGrade(grade: number) {
    sfxPageTurn();
    usedQuestionKeysRef.current.clear();
    setSelectedGrade(grade);
    setShowGradeModal(false);
    setQuestionCount(1);
    const firstQ = generateNextPatternQuestion(1, undefined, grade, usedQuestionKeysRef.current);
    setCurrentQuestion(firstQ);
  }

  // Typewriter & Guru Lab Mouth Flap
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const [mouthOpen, setMouthOpen] = useState<boolean>(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fullQuestionText = currentQuestion?.question || '';

  // Typewriter effect synced with mouth flapping
  useEffect(() => {
    if (showGradeModal || !fullQuestionText) return;

    setDisplayedText('');
    setIsTyping(true);
    setMouthOpen(false);

    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
    }

    let charIndex = 0;
    typingTimerRef.current = setInterval(() => {
      charIndex += 1;
      const currentSlice = fullQuestionText.slice(0, charIndex);
      setDisplayedText(currentSlice);

      const lastChar = fullQuestionText[charIndex - 1];
      const isWhitespaceOrPunct = !lastChar || /[\s.,!?;:—\-]/.test(lastChar);

      if (!isWhitespaceOrPunct) {
        sfxTextBlip();
        const frame = Math.floor(charIndex / 2) % 2 === 0;
        setMouthOpen(frame);
      } else {
        setMouthOpen(false);
      }

      if (charIndex >= fullQuestionText.length) {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        setIsTyping(false);
        setMouthOpen(false);
      }
    }, 65);

    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      setMouthOpen(false);
    };
  }, [fullQuestionText, currentQuestion?.id, showGradeModal]);

  const handleFastForward = useCallback(() => {
    if (isTyping) {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      setDisplayedText(fullQuestionText);
      setIsTyping(false);
      setMouthOpen(false);
    }
  }, [isTyping, fullQuestionText]);

  // Handle Option Select
  function handleSelectOption(index: number) {
    if (!currentQuestion || revealed) return;
    if (isTyping) handleFastForward();

    setSelected(index);
    setRevealed(true);

    const isRight = index === currentQuestion.correctIndex;
    setIsCorrect(isRight);

    // Update Category Stats
    const cat = currentQuestion.category;
    setCategoryBreakdown((prev) => ({
      ...prev,
      [cat]: {
        total: (prev[cat]?.total || 0) + 1,
        correct: (prev[cat]?.correct || 0) + (isRight ? 1 : 0),
      },
    }));

    if (isRight) {
      sfxCorrect();
      sfxArchiveUnlock();
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      setCorrectCount((prev) => prev + 1);
      // Base score 100 + streak bonus (10 * streak)
      const points = 100 + newStreak * 10;
      setScore((prev) => prev + points);
    } else {
      sfxWrong();
      setCurrentStreak(0);
      setTimeout(() => setShowOwl(true), 350);
    }
  }

  // Load Next Procedural Question with grade-tailored difficulty
  function handleNextQuestion() {
    setSelected(null);
    setIsCorrect(null);
    setRevealed(false);
    setShowOwl(false);

    const nextCount = questionCount + 1;
    setQuestionCount(nextCount);
    const nextQ = generateNextPatternQuestion(
      nextCount,
      currentQuestion?.category,
      selectedGrade ?? 1,
      usedQuestionKeysRef.current
    );
    setCurrentQuestion(nextQ);
  }

  function handleTriggerFinish() {
    sfxPageTurn();
    setShowReportModal(true);
  }

  function handleRestartSession() {
    usedQuestionKeysRef.current.clear();
    setQuestionCount(1);
    setCorrectCount(0);
    setScore(0);
    setCurrentStreak(0);
    setMaxStreak(0);
    setCategoryBreakdown({
      aritmatika: { total: 0, correct: 0 },
      geometris: { total: 0, correct: 0 },
      interleaved: { total: 0, correct: 0 },
      visual: { total: 0, correct: 0 },
      lab_science: { total: 0, correct: 0 },
    });
    setSelected(null);
    setIsCorrect(null);
    setRevealed(false);
    setShowReportModal(false);
    setShowGradeModal(true);
  }

  function handleExitToSelect() {
    sfxPageTurn();
    setScreen('background_select');
  }

  const reportStats: PatternReportData = {
    totalAnswered: revealed ? questionCount : questionCount - 1,
    correctCount,
    score,
    maxStreak,
    categoryBreakdown,
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050B14] select-none">
      
      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6">
        <div className="w-full max-w-5xl crt-arcade-frame bg-[#081320] flex flex-col relative overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.45)] border-2 sm:border-4 border-cyan-500 rounded-xl">

          {/* CRT Top Bar - Cyan Science Theme */}
          <div className="p-2 sm:p-4 flex items-center justify-between border-b-2 border-cyan-900/80 bg-cyan-950/90 backdrop-blur-sm z-20 gap-2">
            <div className="flex items-center gap-2">
              <div className="retro-pill-badge !bg-cyan-950 !border-cyan-400 text-cyan-300 !text-[10px] sm:!text-xs !py-1 !px-2.5 flex items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                <span>🔬</span>
                <span>LAB IPA • DETEKTIF POLA</span>
              </div>

              {currentStreak > 1 && (
                <div className="retro-pill-badge !bg-cyan-900 !border-cyan-300 text-cyan-200 !text-[10px] sm:!text-xs !py-1 !px-2.5 animate-pulse shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                  ⚡ STREAK x{currentStreak}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowExitModal(true)}
                className="btn-pixel !bg-slate-800 hover:!bg-slate-700 !border-slate-600 text-slate-200 !text-[10px] sm:!text-xs !py-1 !px-2.5 flex items-center gap-1 cursor-pointer"
                title="Keluar"
              >
                <span>🏠</span>
                <span className="hidden sm:inline">MENU</span>
              </button>

              <button
                onClick={handleTriggerFinish}
                className="btn-pixel !bg-cyan-700 hover:!bg-cyan-600 !border-cyan-400 text-white !text-[10px] sm:!text-xs !py-1 !px-3 flex items-center gap-1.5 cursor-pointer shadow-[0_0_16px_rgba(6,182,212,0.5)] animate-pulse"
                title="Selesaikan sesi kuis dan tampilkan summary report"
              >
                <span>🏁</span>
                <span className="font-bold">AKHIRI SESI & LAPORAN</span>
              </button>
            </div>
          </div>

          {/* Lab Arena Stage with Atmospheric Cyan Blue Science Overlay */}
          <div
            className="relative w-full min-h-[480px] md:min-h-[540px] flex flex-col justify-between p-3 sm:p-6 overflow-hidden"
            style={{
              backgroundImage: `url('/backgrounds/lab_ipa.jpg')`,
              backgroundPosition: 'center center',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/50 via-black/40 to-cyan-950/75 pointer-events-none z-0" />

            {/* Top Info Banner - Cyan Science Styling */}
            <div className="relative z-20 w-full max-w-3xl mx-auto flex items-center justify-between text-xs sm:text-sm font-bold text-cyan-300 bg-cyan-950/85 px-3 py-1.5 rounded-lg border border-cyan-400/60 backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <span className="flex items-center gap-1.5">
                <span className="text-cyan-400">SOAL #{questionCount}</span>
                <span className="text-cyan-600">•</span>
                <span className="text-cyan-200">{currentQuestion?.categoryLabel || 'Detektif Pola'}</span>
              </span>

              <span className="flex items-center gap-3">
                <span className="text-slate-300">BENAR: <strong className="text-emerald-400">{correctCount}</strong></span>
                <span className="text-slate-300">POIN: <strong className="text-cyan-300">{score}</strong></span>
              </span>
            </div>

            {/* Comic Dialogue & Guru Lab Sprite Container */}
            <div className="relative z-20 w-full max-w-3xl mx-auto pt-3 sm:pt-4 mb-2 flex flex-col gap-3">
              <div className="flex flex-row items-end gap-3 sm:gap-4">
                
                {/* Speech Bubble with Cyan Blue Accents */}
                <div
                  onClick={handleFastForward}
                  className="flex-1 comic-bubble-wrapper !border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] flex flex-col justify-center cursor-pointer select-none transition-all hover:border-cyan-300 min-h-[100px] sm:min-h-[135px]"
                  title={isTyping ? 'Klik untuk mempercepat teks' : ''}
                >
                  <div className="w-full flex flex-col px-1 sm:px-2 min-h-[55px] sm:min-h-[75px] justify-center">
                    <p className="font-dialogue text-lg sm:text-2xl text-white tracking-wide leading-snug whitespace-pre-line break-words">
                      {displayedText}
                      {isTyping && <span className="typewriter-cursor text-cyan-400">▋</span>}
                    </p>
                  </div>
                </div>

                {/* Guru Lab Sprite (Scaled 1.2x & controlled via GURU_LAB_CONFIG) */}
                <div className="shrink-0 flex items-end justify-center self-end mb-0.5">
                  <div
                    className="relative w-22 h-31 sm:w-26 sm:h-38 flex items-end justify-center"
                    style={{
                      transform: `scale(${GURU_LAB_CONFIG.spriteScale})`,
                      transformOrigin: 'bottom center',
                    }}
                  >
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
                    {/* CSS Mouth Overlay synced with speech (controlled by GURU_LAB_CONFIG) */}
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: GURU_LAB_CONFIG.mouthPosition.left,
                        bottom: GURU_LAB_CONFIG.mouthPosition.bottom,
                        transform: 'translate(-50%, 50%)',
                        width: mouthOpen
                          ? GURU_LAB_CONFIG.mouthDimensions.openWidth
                          : GURU_LAB_CONFIG.mouthDimensions.closedWidth,
                        height: mouthOpen
                          ? GURU_LAB_CONFIG.mouthDimensions.openHeight
                          : GURU_LAB_CONFIG.mouthDimensions.closedHeight,
                        borderRadius: '50%',
                        backgroundColor: mouthOpen
                          ? GURU_LAB_CONFIG.mouthDimensions.openColor
                          : GURU_LAB_CONFIG.mouthDimensions.closedColor,
                        boxShadow: mouthOpen ? 'inset 0 1px 2px rgba(255,200,180,0.4)' : 'none',
                        transition: `height ${GURU_LAB_CONFIG.mouthDimensions.transitionSpeed} ease, width ${GURU_LAB_CONFIG.mouthDimensions.transitionSpeed} ease`,
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                </div>

              </div>

              {/* Render Visual Matrix 2D Grid Puzzle if present, otherwise text options grid */}
              {currentQuestion?.visualMatrixData ? (
                <VisualMatrixDisplay
                  data={currentQuestion.visualMatrixData}
                  selectedOption={selected}
                  revealed={revealed}
                  correctIndex={currentQuestion.correctIndex}
                  onSelectOption={handleSelectOption}
                />
              ) : (
                /* Options Grid (A, B, C, D) */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {(currentQuestion?.options || []).map((opt, i) => {
                    let stateClass = '';
                    if (revealed) {
                      if (i === currentQuestion?.correctIndex) stateClass = 'correct';
                      else if (i === selected && !isCorrect) stateClass = 'wrong';
                      else stateClass = 'disabled opacity-50';
                    }

                    return (
                      <button
                        key={i}
                        className={`answer-option !text-base sm:!text-2xl !py-2.5 sm:!py-3 !px-3 sm:!px-4 hover:!border-cyan-400 ${stateClass}`}
                        onClick={() => handleSelectOption(i)}
                        disabled={revealed}
                      >
                        <span className="opt-key font-bold font-dialogue text-lg sm:text-2xl shrink-0 text-cyan-300">
                          {OPTION_KEYS[i]})
                        </span>
                        <span className="flex-1 font-dialogue leading-tight text-left text-base sm:text-2xl break-words">
                          {opt}
                        </span>
                        {revealed && i === currentQuestion?.correctIndex && (
                          <span className="text-emerald-400 font-bold text-base sm:text-xl ml-auto shrink-0">✓</span>
                        )}
                        {revealed && i === selected && !isCorrect && (
                          <span className="text-red-400 font-bold text-base sm:text-xl ml-auto shrink-0">✗</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Action Bar for Next Question */}
              {revealed && !showOwl && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 sm:p-3 bg-cyan-950/90 border-2 border-cyan-400 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                  <div className="font-dialogue text-lg sm:text-2xl">
                    {isCorrect ? (
                      <span className="text-emerald-400 font-bold">✨ JAWABAN TEPAT! (+100 Poin)</span>
                    ) : (
                      <span className="text-red-400">Pola belum tepat. Pelajari analisisnya!</span>
                    )}
                  </div>

                  <button
                    className="btn-pixel !bg-cyan-700 hover:!bg-cyan-600 !border-cyan-400 text-white !py-2 !px-4 sm:!px-6 text-xs sm:text-sm flex items-center gap-2 ml-auto cursor-pointer shadow-lg"
                    onClick={handleNextQuestion}
                  >
                    <span>SOAL SELANJUTNYA ▶</span>
                  </button>
                </div>
              )}

            </div>

            {/* Bottom Floor Stage with Student Sprite */}
            <div className="relative z-10 w-full mt-auto flex items-end justify-between px-2 sm:px-6 pt-2">
              <div className="flex items-end gap-2 sm:gap-3">
                <PixelSprite character={character} pixelSize={0.38} animate />
                <div className="bg-cyan-950/90 border border-cyan-400/60 px-2.5 py-1 rounded-lg text-cyan-300 font-dialogue text-base sm:text-lg shadow-lg mb-1">
                  {studentName || 'Petualang'}
                </div>
              </div>

              <div className="mb-1">
                <div className="bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 font-dialogue text-xs sm:text-base px-3 py-1 rounded-lg hidden sm:block shadow-md">
                  ♾️ Mode Infinite • Jawab sepuasnya & akhiri kapan saja!
                </div>
              </div>
            </div>

          </div>

          {/* CRT Bottom Bar - Cyan Blue Theme */}
          <div className="p-2 sm:p-3 flex items-center justify-between border-t-2 border-cyan-900/80 bg-cyan-950/95 z-20 font-dialogue text-xs sm:text-base text-cyan-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <span className="font-bold text-cyan-200">DETEKTIF POLA</span>
            </div>

            <div className="flex items-center gap-4 text-cyan-300">
              <span>AKURASI: <strong className="text-white">{questionCount > 1 ? Math.round((correctCount / (revealed ? questionCount : questionCount - 1)) * 100) : 0}%</strong></span>
              <span>TOTAL POIN: <strong className="text-cyan-200">{score}</strong></span>
            </div>
          </div>

        </div>
      </div>

      {/* ── Summary Report Modal ──────────────────────────────────────────────── */}
      {showReportModal && (
        <PatternReportModal
          studentName={studentName}
          character={character}
          stats={reportStats}
          selectedGrade={selectedGrade || 6}
          onRetry={handleRestartSession}
          onExit={handleExitToSelect}
        />
      )}

      {/* ── Grade Selection Modal (Konfirmasi Tingkat Kelas SD) ────────────────────────── */}
      {showGradeModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 md:p-10 select-none animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-3xl sm:max-w-4xl lg:max-w-5xl max-h-[92vh] overflow-y-auto crt-arcade-frame bg-[#081320] border-4 border-cyan-400 rounded-3xl p-5 sm:p-8 md:p-12 shadow-[0_0_60px_rgba(6,182,212,0.6)] text-stone-100 font-pixel text-center flex flex-col items-center my-auto custom-scrollbar">
            
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 bg-cyan-950/90 border-2 border-cyan-400 text-cyan-300 font-bold text-xs sm:text-sm md:text-base px-4 py-1.5 rounded-full mb-6 sm:mb-8 shadow-[0_0_20px_rgba(6,182,212,0.45)] uppercase tracking-widest shrink-0">
              <span>🔬</span>
              <span>KONFIRMASI TINGKAT KELAS SD</span>
            </div>

            {/* Guru Lab Character & Intro Dialogue Box */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-cyan-950/90 border-2 border-cyan-500/70 rounded-2xl px-6 sm:px-10 md:px-12 py-5 sm:py-7 mb-8 sm:mb-10 text-left w-full shadow-xl shrink-0">
              <div className="flex-1 font-dialogue text-base sm:text-lg md:text-xl text-cyan-100 leading-relaxed pl-3 sm:pl-6 md:pl-8 pr-2">
                <span className="bg-cyan-900/80 border border-cyan-400/60 text-cyan-300 font-bold px-3 py-1 rounded-lg inline-block mr-3 mb-1.5 shadow-sm">
                  Guru Lab:
                </span>
                <span className="inline-block mt-1 sm:mt-0">
                  “Selamat datang di Laboratorium IPA! Sebelum kita mulai bereksperimen, kamu sedang menempuh pendidikan di Kelas berapa?”
                </span>
              </div>
              <div className="shrink-0 relative w-16 h-24 sm:w-20 sm:h-28 flex items-end justify-center pr-2 sm:pr-4">
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

            {/* 6 Grade Buttons Grid (Kelas 1 - 6 SD) with Generous Spacing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 w-full text-left font-dialogue mb-2 shrink-0">
              {[
                { grade: 1, title: 'Kelas 1 SD', desc: 'Pola Penjumlahan (+1..+5) • Rotasi 2D' },
                { grade: 2, title: 'Kelas 2 SD', desc: 'Pola Loncat (+2,+5,+10) • Deret Gambar' },
                { grade: 3, title: 'Kelas 3 SD', desc: 'Pola Bertingkat • Perkalian ×2/×3' },
                { grade: 4, title: 'Kelas 4 SD', desc: 'Perkalian Kelipatan • Deret Kuadrat' },
                { grade: 5, title: 'Kelas 5 SD', desc: 'Deret Kuadrat • Pembelahan Sel' },
                { grade: 6, title: 'Kelas 6 SD', desc: 'Fibonacci • Matriks Gambar 3x3 TPA' },
              ].map((g) => (
                <button
                  key={g.grade}
                  onClick={() => handleConfirmGrade(g.grade)}
                  className="btn-pixel !bg-slate-900/90 hover:!bg-cyan-950 !border-cyan-500/80 hover:!border-cyan-300 text-slate-100 p-4 sm:p-5 md:p-6 rounded-2xl flex flex-col justify-between transition-all hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(6,182,212,0.45)] cursor-pointer group shadow-lg min-h-[95px] sm:min-h-[115px]"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="font-bold text-cyan-300 group-hover:text-cyan-100 text-base sm:text-lg md:text-xl">
                      {g.title}
                    </span>
                    <span className="text-sm text-cyan-400 group-hover:translate-x-1 transition-transform">▶</span>
                  </div>
                  <span className="text-xs sm:text-sm text-slate-300 group-hover:text-cyan-200 leading-snug">
                    {g.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* Cancel / Exit Action Button with Generous Blank Space & Divider Line */}
            <div className="w-full mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t-2 border-cyan-900/70 flex items-center justify-center shrink-0">
              <button
                onClick={() => setScreen('background_select')}
                className="btn-pixel !bg-slate-800 hover:!bg-slate-700 !border-slate-500 hover:!border-cyan-400 text-slate-200 hover:text-white px-8 sm:px-10 py-3.5 sm:py-4 text-xs sm:text-sm md:text-base font-bold flex items-center justify-center gap-3 cursor-pointer transition-all hover:scale-105 shadow-2xl font-dialogue uppercase tracking-wider rounded-xl"
              >
                <span>◀</span>
                <span>KEMBALI KE TEMPAT BELAJAR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Exit Confirmation Modal ───────────────────────────────────────────── */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-5 select-none animate-fadeIn">
          <div className="relative w-full max-w-md crt-arcade-frame bg-[#140a0a] border-4 border-amber-600 rounded-2xl p-5 sm:p-6 shadow-2xl text-stone-100 font-pixel text-center">
            <div className="inline-block bg-amber-950 border-2 border-amber-500 text-amber-300 font-bold text-xs px-3 py-1 rounded-full mb-3 uppercase tracking-widest">
              ⚠️ AKHIRI KUIS
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-amber-300 mb-2 leading-tight">
              KEMBALI KE MENU TEMPAT BELAJAR?
            </h3>

            <p className="font-dialogue text-base sm:text-lg text-stone-300 mb-6 leading-relaxed">
              Kamu bisa melihat summary report hasil kuis sebelum keluar, atau langsung kembali ke tempat belajar.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setShowExitModal(false);
                  setShowReportModal(true);
                }}
                className="btn-pixel btn-pixel-gold px-5 py-2.5 text-xs sm:text-sm font-bold w-full cursor-pointer"
              >
                <span>🏁</span>
                <span>LIHAT LAPORAN RINGKASAN SESI</span>
              </button>

              <button
                onClick={() => {
                  setShowExitModal(false);
                  setScreen('background_select');
                }}
                className="btn-pixel !bg-stone-800 hover:!bg-stone-700 !border-stone-600 text-stone-200 px-5 py-2.5 text-xs sm:text-sm font-bold w-full cursor-pointer"
              >
                <span>🏠</span>
                <span>KELUAR TANPA LAPORAN</span>
              </button>

              <button
                onClick={() => setShowExitModal(false)}
                className="text-stone-400 hover:text-white text-xs font-dialogue py-1 mt-1 cursor-pointer"
              >
                Kembali ke kuis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Guardian Owl / Guru Lab Hint Modal ────────────────────────────────── */}
      {showOwl && (
        <GuardianOwlModal
          hint={currentQuestion?.hint || ''}
          onClose={() => setShowOwl(false)}
        />
      )}
    </div>
  );
}
