'use client';

/**
 * BossBattleArena.tsx
 * QuickMath Arithmo-Boss Battle — Ruang Kelas Unggulan (Lawan Sombo)
 *
 * Visual & Gameplay fixes:
 *  1. Sombo sprite size synchronized with student player (height-matched)
 *  2. Sombo sprite faces LEFT towards student player with clean outer alpha transparency
 *  3. White cell-shading drop-shadow outline (same as Pak Guru & Student Player)
 *  4. Recalibrated mouth overlay position to X=51%, Y=63.6% (100% pixel-aligned)
 *  5. Question box & 4 answer choices centered in middle of screen
 *  6. Crisp, high-contrast, highly legible retro pixelated font ('Pixelify Sans')
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import PixelSprite from '../PixelSprite';
import { sfxCorrect, sfxWrong, sfxTextBlip, unlockAudioEngine, startQuizBGM, stopQuizBGM, isBgmMuted, toggleBgmMute, isSfxMuted, toggleSfxMute } from '@/lib/audioEngine';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'intro' | 'battle' | 'defeated' | 'endless' | 'gameover';

interface BossQuestion {
  a: number;
  b: number;
  op: '+' | '-';
  answer: number;
  options: number[];
  hasCarryBorrow: boolean;
  difficultyFactor: number;
  timeLimit: number;
}

interface FloatDmg {
  id: number;
  value: string;
  isCritical: boolean;
  x: number;
}

interface MistakeLog {
  questionStr: string;
  correctAnswer: number;
  userAnswer: number | null;
  category: 'carrying' | 'borrowing' | 'basic' | 'timeout';
  categoryLabel: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const BOSS_MAX_HP = 6000;
const PLAYER_MAX_HP = 100;

const INTRO_SPEECH =
  'Heh, kalian semua cuma buang-buang waktu kalau mikir bisa ngalahin Sombo! ' +
  'Otak jeniusku ini beda kelas! ' +
  'Berani adu hitung cepat lawan aku? ' +
  'Cuma butuh beberapa tantangan buat bikin kalian sadar batas kemampuan kalian!';

const DEFEATED_SPEECH =
  'Aaargh! tidak mungkin aku bisa dikalahkan olehmu. ' +
  'Apakah rajin-mu bisa mengalahkan bakat-ku?';

// White outer cell-shading drop-shadow style (same as Pak Guru & Student Player)
const WHITE_CELL_SHADING = [
  'drop-shadow(1.5px 0px 0px rgba(255,255,255,0.95))',
  'drop-shadow(-1.5px 0px 0px rgba(255,255,255,0.95))',
  'drop-shadow(0px 1.5px 0px rgba(255,255,255,0.95))',
  'drop-shadow(0px -1.5px 0px rgba(255,255,255,0.95))',
  'drop-shadow(0px 8px 16px rgba(0,0,0,0.85))',
].join(' ');

// ─── Question Generator (Dynamic Tiered System — Q15+ Peak Difficulty) ─────────

function hasCarrying(a: number, b: number): boolean {
  return (a % 10) + (b % 10) >= 10;
}
function hasBorrowing(a: number, b: number): boolean {
  return (a % 10) < (b % 10);
}

function genQuestion(qIndex: number): BossQuestion {
  const isTier1 = qIndex <= 4;
  const isTier2 = qIndex >= 5 && qIndex <= 9;
  const isTier3 = qIndex >= 10 && qIndex <= 14;
  // Tier 4 = qIndex >= 15 (TIER TERSULIT / PEAK TIER)

  let a: number, b: number, op: '+' | '-', carry: boolean;
  let timeLimit: number;
  let diffFactor: number;

  if (isTier1) {
    op = '+';
    do {
      a = 10 + Math.floor(Math.random() * 80);
      b = 10 + Math.floor(Math.random() * (99 - a));
    } while (hasCarrying(a, b));
    carry = false;
    timeLimit = 6.5;
    diffFactor = 1.0;
  } else if (isTier2) {
    op = Math.random() < 0.5 ? '+' : '-';
    carry = Math.random() < 0.5;
    if (op === '+') {
      do {
        a = 15 + Math.floor(Math.random() * 75);
        b = 10 + Math.floor(Math.random() * Math.min(80, 99 - a));
      } while (hasCarrying(a, b) !== carry);
    } else {
      do {
        a = 25 + Math.floor(Math.random() * 65);
        b = 10 + Math.floor(Math.random() * (a - 10));
      } while (hasBorrowing(a, b) !== carry);
    }
    timeLimit = 5.5;
    diffFactor = 1.2;
  } else if (isTier3) {
    op = Math.random() < 0.5 ? '+' : '-';
    carry = true;
    if (op === '+') {
      do {
        a = 35 + Math.floor(Math.random() * 55);
        b = 15 + Math.floor(Math.random() * Math.min(55, 99 - a));
      } while (!hasCarrying(a, b));
    } else {
      do {
        a = 40 + Math.floor(Math.random() * 50);
        b = 15 + Math.floor(Math.random() * (a - 15));
      } while (!hasBorrowing(a, b));
    }
    timeLimit = 4.5;
    diffFactor = 1.5;
  } else {
    // ─── TIER TERSULIT (Pertanyaan 15 Ke Atas) ──────────────────────────────
    // 3-digit carrying / borrowing & complex math challenges!
    op = Math.random() < 0.5 ? '+' : '-';
    carry = true;
    if (op === '+') {
      do {
        a = 45 + Math.floor(Math.random() * 105);
        b = 25 + Math.floor(Math.random() * 95);
      } while (!hasCarrying(a, b));
    } else {
      do {
        a = 60 + Math.floor(Math.random() * 115);
        b = 25 + Math.floor(Math.random() * (a - 25));
      } while (!hasBorrowing(a, b));
    }
    timeLimit = qIndex >= 20 ? 3.2 : 3.6;
    diffFactor = 2.0;
  }

  const answer = op === '+' ? a + b : a - b;

  const opts = new Set<number>();
  opts.add(answer);
  while (opts.size < 4) {
    const delta = (Math.floor(Math.random() * 20) - 10) || 3;
    const fake = answer + delta;
    if (fake !== answer && fake > 0 && fake < 400) opts.add(fake);
  }
  const options = Array.from(opts).sort(() => Math.random() - 0.5);

  return { a, b, op, answer, options, hasCarryBorrow: carry, difficultyFactor: diffFactor, timeLimit };
}

function endlessTimerForN(n: number): number {
  return 2.2 + (4.5 - 2.2) * Math.exp(-0.028 * n);
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function BossBattleArena() {
  const { character, studentName, setScreen } = useGameStore();

  // Phase
  const [phase, setPhase] = useState<Phase>('intro');

  // Intro typewriter
  const [introText, setIntroText]     = useState('');
  const [introTyping, setIntroTyping] = useState(false);
  const [bossMouth, setBossMouth]     = useState(false);
  const introTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Battle state
  const [bossHp, setBossHp]         = useState(BOSS_MAX_HP);
  const [playerHp, setPlayerHp]     = useState(PLAYER_MAX_HP);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [combo, setCombo]           = useState(0);
  const [maxCombo, setMaxCombo]     = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [question, setQuestion]     = useState<BossQuestion | null>(null);
  const [answered, setAnswered]     = useState<number | null>(null);
  const [timeLeft, setTimeLeft]     = useState(0);
  const [timePct, setTimePct]       = useState(100);
  const [floatDmgs, setFloatDmgs]   = useState<FloatDmg[]>([]);
  const [showFlash, setShowFlash]   = useState(false);
  const [rageShake, setRageShake]   = useState(false);
  const [heartAnim, setHeartAnim]   = useState(false);
  const [heartCount, setHeartCount] = useState(3);
  const heartCountRef               = useRef(3);

  const resetGameState = useCallback(() => {
    heartCountRef.current = 3;
    setHeartCount(3);
    setBossHp(BOSS_MAX_HP);
    setPlayerHp(PLAYER_MAX_HP);
    setQuestionNumber(1);
    setCombo(0);
    setMaxCombo(0);
    setTotalScore(0);
    setMistakes([]);
    setPhase('intro');
  }, []);

  // Endless state
  const [endlessN, setEndlessN]     = useState(1);

  // Audio Mute States
  const [bgmMutedState, setBgmMutedState] = useState(isBgmMuted());
  const [sfxMutedState, setSfxMutedState] = useState(isSfxMuted());

  // Mistake Analysis State
  const [mistakes, setMistakes] = useState<MistakeLog[]>([]);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // Defeated typewriter
  const [defeatText, setDefeatText]   = useState('');
  const [defeatTyping, setDefeatTyping] = useState(false);
  const defeatTimerRef = useRef<NodeJS.Timeout | null>(null);

  const timerRef  = useRef<NodeJS.Timeout | null>(null);
  const dmgId     = useRef(0);
  const startTime = useRef<number>(0);
  const qTimeLimit = useRef<number>(5);

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const addFloat = useCallback((text: string, isCritical: boolean) => {
    const id = ++dmgId.current;
    const x = 30 + Math.random() * 40;
    setFloatDmgs(prev => [...prev.slice(-4), { id, value: text, isCritical, x }]);
    setTimeout(() => setFloatDmgs(prev => prev.filter(d => d.id !== id)), 1200);
  }, []);

  const triggerHeartDamage = useCallback(() => {
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 600);
  }, []);

  const triggerRage = useCallback(() => {
    setRageShake(true);
    setTimeout(() => setRageShake(false), 600);
  }, []);

  function hpToHearts(hp: number): number {
    if (hp >= 67) return 3;
    if (hp >= 34) return 2;
    if (hp > 0)  return 1;
    return 0;
  }

  const renderAnalysisModal = () => {
    if (!showAnalysisModal) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-5 select-none animate-fadeIn">
        <div className="relative w-full max-w-2xl crt-arcade-frame bg-[#0d0514] border-4 border-amber-500 rounded-2xl p-4 sm:p-6 shadow-2xl text-stone-100 font-pixel max-h-[90vh] flex flex-col justify-between overflow-y-auto">

          {/* Modal Header */}
          <div>
            <div className="flex items-center justify-between border-b-2 border-amber-900/60 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl">📊</span>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-amber-300 tracking-wide">
                    ANALISIS KESALAHAN & EVALUASI
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-400">
                    Laporan evaluasi pengerjaan soal untuk sesi pembelajaran berikutnya
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="text-stone-400 hover:text-white text-xl px-2 py-0.5 rounded bg-stone-800 border border-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Evaluation Summary Banner */}
            {mistakes.length === 0 ? (
              <div className="bg-emerald-950/80 border border-emerald-500 rounded-xl p-4 mb-4 text-center">
                <span className="text-4xl block mb-2">🎉</span>
                <h3 className="text-lg font-bold text-emerald-300 mb-1">PERFORMA SEMPURNA!</h3>
                <p className="text-xs sm:text-sm text-stone-300">
                  Kamu tidak melakukan kesalahan sama sekali! Semua jawaban dihitung dengan akurasi 100%!
                </p>
              </div>
            ) : (
              <div>
                {/* Category Breakdown Cards */}
                <h3 className="text-sm sm:text-base font-bold text-amber-200 mb-2">
                  📋 Ringkasan Kesalahan per Tipe Soal:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  <div className="bg-red-950/60 border border-red-800 rounded-lg p-2.5 text-center">
                    <span className="text-xs text-stone-400 block">Simpan (Carry)</span>
                    <span className="text-lg sm:text-xl font-bold text-red-300">
                      {mistakes.filter(m => m.category === 'carrying').length}x Salah
                    </span>
                  </div>
                  <div className="bg-blue-950/60 border border-blue-800 rounded-lg p-2.5 text-center">
                    <span className="text-xs text-stone-400 block">Pinjam (Borrow)</span>
                    <span className="text-lg sm:text-xl font-bold text-blue-300">
                      {mistakes.filter(m => m.category === 'borrowing').length}x Salah
                    </span>
                  </div>
                  <div className="bg-amber-950/60 border border-amber-800 rounded-lg p-2.5 text-center">
                    <span className="text-xs text-stone-400 block">Hitungan Dasar</span>
                    <span className="text-lg sm:text-xl font-bold text-amber-300">
                      {mistakes.filter(m => m.category === 'basic').length}x Salah
                    </span>
                  </div>
                  <div className="bg-purple-950/60 border border-purple-800 rounded-lg p-2.5 text-center">
                    <span className="text-xs text-stone-400 block">Waktu Habis</span>
                    <span className="text-lg sm:text-xl font-bold text-purple-300">
                      {mistakes.filter(m => m.category === 'timeout').length}x Timeout
                    </span>
                  </div>
                </div>

                {/* Top Area for Improvement / Pedagogical Recommendation */}
                <div className="bg-amber-950/40 border border-amber-600/70 rounded-xl p-3.5 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">💡</span>
                    <h4 className="text-sm sm:text-base font-bold text-amber-300">
                      Saran Pembelajaran Sesi Berikutnya:
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-100 leading-relaxed font-mono">
                    {(() => {
                      const c = mistakes.filter(m => m.category === 'carrying').length;
                      const b = mistakes.filter(m => m.category === 'borrowing').length;
                      const t = mistakes.filter(m => m.category === 'timeout').length;
                      if (c >= b && c >= t && c > 0) {
                        return '★ Fokus pada Penjumlahan Simpan: Ingatlah untuk selalu menjumlahkan 1 angka simpanan ke kolom puluhan di depannya saat digit satuan ≥ 10!';
                      } else if (b >= c && b >= t && b > 0) {
                        return '★ Fokus pada Pengurangan Pinjam: Saat digit atas lebih kecil, pinjam 10 dari angka puluhan di sebelahnya sebelum mengurangi.';
                      } else if (t > 0) {
                        return '★ Tingkatkan Kecepatan: Cobalah perkirakan digit terakhir (satuan) terlebih dahulu untuk mengeliminasi pilihan salah dengan cepat.';
                      } else {
                        return '★ Latih ketelitian hitung dasar agar tidak terburu-buru memilih jawaban!';
                      }
                    })()}
                  </p>
                </div>

                {/* List of Missed Questions */}
                <h3 className="text-sm sm:text-base font-bold text-stone-300 mb-2">
                  🔍 Daftar Rincian Soal yang Salah:
                </h3>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                  {mistakes.map((m, idx) => (
                    <div key={idx} className="bg-black/70 border border-red-900/50 rounded-lg p-2.5 flex items-center justify-between text-xs sm:text-sm">
                      <div>
                        <span className="font-bold text-amber-300 mr-2">{m.questionStr}</span>
                        <span className="text-stone-400 block sm:inline text-[11px]">{m.categoryLabel}</span>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="text-emerald-400 font-bold block">Benar: {m.correctAnswer}</span>
                        <span className="text-red-400 text-[11px]">
                          Kamu: {m.userAnswer !== null ? m.userAnswer : 'Timeout'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-stone-800 pt-3 mt-2">
            <button
              onClick={() => setShowAnalysisModal(false)}
              className="btn-pixel !bg-stone-800 hover:!bg-stone-700 !border-stone-600 text-stone-300 px-5 py-2 text-xs sm:text-sm w-full sm:w-auto cursor-pointer"
            >
              TUTUP
            </button>

            <button
              onClick={() => {
                setShowAnalysisModal(false);
                resetGameState();
              }}
              className="btn-pixel !bg-red-900 hover:!bg-red-800 !border-red-600 text-red-200 px-6 py-2 text-xs sm:text-sm font-bold w-full sm:w-auto cursor-pointer"
            >
              🔄 Ulangi Pertarungan
            </button>
          </div>

        </div>
      </div>
    );
  };

  // ─── Ultra Fast-Beat BGM for All Sessions with Sombo ────────────────────────
  useEffect(() => {
    startQuizBGM('fast_boss_beat');
    return () => {
      stopQuizBGM();
    };
  }, []);

  // ─── Intro Typewriter ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'intro') return;
    setIntroText('');
    setIntroTyping(true);
    setBossMouth(false);
    let i = 0;
    introTimerRef.current = setInterval(() => {
      i++;
      setIntroText(INTRO_SPEECH.slice(0, i));
      const ch = INTRO_SPEECH[i - 1];
      const isPause = /[\s.,!?;:—-]/.test(ch || '');
      if (!isPause) {
        sfxTextBlip();
        setBossMouth(Math.floor(i / 2) % 2 === 0);
      } else {
        setBossMouth(false);
      }
      if (i >= INTRO_SPEECH.length) {
        clearInterval(introTimerRef.current!);
        setIntroTyping(false);
        setBossMouth(false);
      }
    }, 45);
    return () => { if (introTimerRef.current) clearInterval(introTimerRef.current); };
  }, [phase]);

  // ─── Defeated Typewriter ──────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'defeated') return;
    setDefeatText('');
    setDefeatTyping(true);
    let i = 0;
    defeatTimerRef.current = setInterval(() => {
      i++;
      setDefeatText(DEFEATED_SPEECH.slice(0, i));
      const ch = DEFEATED_SPEECH[i - 1];
      const isPause = /[\s.,!?;:—-]/.test(ch || '');
      if (!isPause) sfxTextBlip();
      if (i >= DEFEATED_SPEECH.length) {
        clearInterval(defeatTimerRef.current!);
        setDefeatTyping(false);
      }
    }, 55);
    return () => { if (defeatTimerRef.current) clearInterval(defeatTimerRef.current); };
  }, [phase]);

  // ─── Load Question ────────────────────────────────────────────────────────────

  // ─── Load Question ────────────────────────────────────────────────────────────

  const loadQuestion = useCallback((qIndex: number) => {
    const q = genQuestion(qIndex);
    setQuestion(q);
    setAnswered(null);
    qTimeLimit.current = q.timeLimit;
    startTime.current  = Date.now();
    setTimeLeft(q.timeLimit);
    setTimePct(100);
  }, []);

  const loadEndlessQuestion = useCallback((n: number) => {
    const limit = endlessTimerForN(n);
    const q = genQuestion(Math.min(10, Math.ceil(n / 3)));
    setQuestion({ ...q, timeLimit: limit });
    setAnswered(null);
    qTimeLimit.current = limit;
    startTime.current  = Date.now();
    setTimeLeft(limit);
    setTimePct(100);
  }, []);

  useEffect(() => {
    if (phase !== 'battle') return;
    heartCountRef.current = 3;
    setHeartCount(3);
    setPlayerHp(PLAYER_MAX_HP);
    setBossHp(BOSS_MAX_HP);
    setQuestionNumber(1);
    setCombo(0);
    setMaxCombo(0);
    setTotalScore(0);
    setMistakes([]);
    setAnswered(null);
    loadQuestion(1);
  }, [phase, loadQuestion]);

  // ─── Timer Tick ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if ((phase !== 'battle' && phase !== 'endless') || answered !== null) return;

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime.current) / 1000;
      const remaining = Math.max(0, qTimeLimit.current - elapsed);
      const pct = (remaining / qTimeLimit.current) * 100;
      setTimeLeft(remaining);
      setTimePct(pct);

      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        handleTimeout();
      }
    }, 50);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, question, answered]);

  // ─── Timeout Handler ──────────────────────────────────────────────────────────

  function handleTimeout() {
    if (answered !== null || heartCountRef.current <= 0) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setAnswered(-1);
    sfxWrong();
    triggerHeartDamage();

    if (question) {
      setMistakes(prev => [
        ...prev,
        {
          questionStr: `${question.a} ${question.op} ${question.b} = ?`,
          correctAnswer: question.answer,
          userAnswer: null,
          category: 'timeout',
          categoryLabel: '⏱ Kecepatan / Waktu Habis',
        }
      ]);
    }

    // Sombo HP Recovery on Timeout (+400 HP up to max 6000)
    setBossHp(prevHp => Math.min(BOSS_MAX_HP, prevHp + 400));
    addFloat('+400 HP SOMBO RECOVER! ❤️‍d', false);
    triggerRage();

    heartCountRef.current = Math.max(0, heartCountRef.current - 1);
    const nextHearts = heartCountRef.current;
    setHeartCount(nextHearts);
    setPlayerHp(Math.round((nextHearts / 3) * 100));
    setCombo(0);
    if (nextHearts <= 0) {
      setTimeout(() => setPhase('gameover'), 500);
      return;
    }
    setTimeout(() => afterAnswer(), 800);
  }

  // ─── Answer Handler ───────────────────────────────────────────────────────────

  function handleAnswer(opt: number) {
    if (answered !== null || heartCountRef.current <= 0 || !question) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsed = (Date.now() - startTime.current) / 1000;
    setAnswered(opt);

    if (opt === question.answer) {
      sfxCorrect();
      const speedMult = 1.0 + (qTimeLimit.current - elapsed) / qTimeLimit.current;
      const comboMult = 1.0 + Math.min(combo, 10) * 0.1;
      const dmg = Math.round(135 * speedMult * comboMult * question.difficultyFactor);
      const isCritical = speedMult > 1.6;

      const newBossHp = Math.max(0, bossHp - dmg);
      setBossHp(newBossHp);

      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(m => Math.max(m, newCombo));
      setTotalScore(s => s + dmg);

      if (isCritical) {
        addFloat(`⚡ ${dmg} CRITICAL!`, true);
      } else {
        addFloat(`-${dmg}`, false);
      }

      if (newCombo % 5 === 0) {
        heartCountRef.current = Math.min(3, heartCountRef.current + 1);
        const nextHearts = heartCountRef.current;
        setHeartCount(nextHearts);
        setPlayerHp(Math.round((nextHearts / 3) * 100));
        addFloat('+1 HATI ❤️', false);
      }

      // Defeat transition if boss HP reaches 0
      if (phase === 'battle' && newBossHp <= 0) {
        setTimeout(() => {
          setShowFlash(true);
          setTimeout(() => setShowFlash(false), 600);
          setTimeout(() => setPhase('defeated'), 300);
        }, 700);
        return;
      }

      setTimeout(() => afterAnswer(), 700);
    } else {
      sfxWrong();
      triggerHeartDamage();

      if (question) {
        let cat: 'carrying' | 'borrowing' | 'basic' = 'basic';
        let catLabel = '➕/➖ Operasi Hitung Dasar';
        if (question.hasCarryBorrow) {
          if (question.op === '+') {
            cat = 'carrying';
            catLabel = '★ Penjumlahan Simpan (Carrying)';
          } else {
            cat = 'borrowing';
            catLabel = '★ Pengurangan Pinjam (Borrowing)';
          }
        }

        setMistakes(prev => [
          ...prev,
          {
            questionStr: `${question.a} ${question.op} ${question.b} = ?`,
            correctAnswer: question.answer,
            userAnswer: opt,
            category: cat,
            categoryLabel: catLabel,
          }
        ]);
      }

      // Sombo HP Recovery on Wrong Answer (+400 HP up to max 6000)
      setBossHp(prevHp => Math.min(BOSS_MAX_HP, prevHp + 400));
      addFloat('+400 HP SOMBO RECOVER! ❤️‍d', false);
      triggerRage();

      heartCountRef.current = Math.max(0, heartCountRef.current - 1);
      const nextHearts = heartCountRef.current;
      setHeartCount(nextHearts);
      setPlayerHp(Math.round((nextHearts / 3) * 100));
      setCombo(0);
      if (nextHearts <= 0) {
        setTimeout(() => setPhase('gameover'), 800);
        return;
      }
      setTimeout(() => afterAnswer(), 700);
    }
  }

  function afterAnswer() {
    if (phase === 'battle') {
      setQuestionNumber(prev => {
        const nextQ = prev + 1;
        loadQuestion(nextQ);
        return nextQ;
      });
    } else if (phase === 'endless') {
      const nextN = endlessN + 1;
      setEndlessN(nextN);
      loadEndlessQuestion(nextN);
    }
  }

  function startEndless() {
    setEndlessN(1);
    setPhase('endless');
    setCombo(0);
    loadEndlessQuestion(1);
  }

  function timerClass(pct: number): string {
    if (pct > 60) return 'timer-bar-green';
    if (pct > 30) return 'timer-bar-yellow';
    return `timer-bar-red ${pct <= 29 ? 'timer-bar-blink' : ''}`;
  }

  const bossPct = Math.max(0, (bossHp / BOSS_MAX_HP) * 100);

  // ── INTRO ──────────────────────────────────────────────────────────────────

  if (phase === 'intro') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-5 relative overflow-hidden select-none"
        style={{
          backgroundImage: 'url(/backgrounds/classroom_battle.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/75" />
        <div className="crt-scanlines-overlay" />
        {showFlash && <div className="screen-flash" />}

        {/* Comic Battle Title */}
        <div className="relative z-10 text-center mb-4">
          <div className="inline-block bg-red-700 border-4 border-red-400 px-6 py-1.5 rounded-full shadow-xl mb-2">
            <span className="font-pixel text-white text-base sm:text-xl tracking-widest uppercase">
              ⚔️ RUANG KELAS UNGGULAN — TANTANGAN SOMBO
            </span>
          </div>
        </div>


        {/* Comic Panel Box: Student (left), Chat Bubble (center), Sombo (right) */}
        <div className="relative z-10 w-full max-w-4xl crt-arcade-frame bg-[#0d0505] border-4 border-red-900 rounded-2xl p-4 sm:p-6 shadow-2xl">

          {/* ── ROW: Player (left) ··· Chat Bubble (center) ··· Sombo (right) ── */}
          <div className="flex flex-row items-end sm:items-center justify-between gap-3 sm:gap-4 mb-6">

            {/* Student Player (left) */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <PixelSprite character={character} pixelSize={0.33} animate />
              <div className="bg-black/80 border border-amber-500/50 text-amber-300 font-pixel text-xs sm:text-sm px-2 py-0.5 rounded shadow">
                {studentName || 'Petualang'}
              </div>
            </div>

            {/* Chat Bubble (center, beak points RIGHT to Sombo, fit for 2 lines from start) */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="boss-bubble boss-bubble-right px-6 sm:px-8 py-4 sm:py-5 shadow-xl w-full min-h-[100px] sm:min-h-[125px] flex flex-col justify-center">
                <div className="w-full min-h-[56px] sm:min-h-[72px] flex items-center px-3 sm:px-5">
                  <p className="font-pixel text-base sm:text-xl md:text-2xl text-stone-900 leading-snug sm:leading-relaxed font-bold tracking-wide px-2 sm:px-4">
                    {introText}
                    {introTyping && <span className="animate-pulse">▋</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Sombo sprite (right, inside the box, scaleX(-1) faces left) */}
            <div className="shrink-0 flex flex-col items-center gap-1.5 mr-4 sm:mr-8 md:mr-10">
              <div className="relative h-36 sm:h-48 flex items-end justify-center">
                <img
                  src="/sprites/boss_challenging.png"
                  alt="Sombo"
                  className="h-full w-auto object-contain"
                  style={{
                    imageRendering: 'pixelated',
                    filter: WHITE_CELL_SHADING,
                    transform: 'scaleX(-1)',
                  }}
                />
                {/* CSS mouth overlay — calibrated pixel-perfect X=45.7%, Y=69.7% */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: '45.4%',
                    bottom: '66.95%',
                    transform: 'translate(-50%, 50%)',
                    width: bossMouth ? '12%' : '9%',
                    height: bossMouth ? '3.5%' : '2%',
                    borderRadius: '45%',
                    backgroundColor: bossMouth ? 'rgba(20,5,5,0.95)' : 'rgba(45,18,10,0.82)',
                    transition: 'height 55ms ease, width 55ms ease',
                    pointerEvents: 'none',
                  }}
                />
              </div>
              <div className="bg-red-950/90 border border-red-500/50 text-red-200 font-pixel font-bold text-xs sm:text-sm px-2.5 py-0.5 rounded shadow">
                SOMBO
              </div>
            </div>

          </div>

          {/* Action Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-red-950/80">
            <button
              onClick={() => setScreen('background_select')}
              className="btn-pixel !bg-stone-800 hover:!bg-stone-700 !border-stone-600 text-stone-300 px-5 py-2.5 text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer shadow-md w-full sm:w-auto"
            >
              <span>◀</span>
              <span>PILIH TEMPAT BELAJAR</span>
            </button>

            {!introTyping ? (
              <button
                onClick={() => {
                  unlockAudioEngine();
                  setShowFlash(true);
                  setTimeout(() => setShowFlash(false), 400);
                  setTimeout(() => setPhase('battle'), 200);
                }}
                className="btn-pixel !bg-red-800 hover:!bg-red-700 !border-red-500 text-white px-8 py-3 text-sm sm:text-base font-bold shadow-xl w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>⚔️</span>
                <span>TERIMA TANTANGAN</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (introTimerRef.current) clearInterval(introTimerRef.current);
                  setIntroText(INTRO_SPEECH);
                  setIntroTyping(false);
                  setBossMouth(false);
                }}
                className="btn-pixel !bg-stone-800 !border-stone-600 text-stone-300 px-6 py-2 text-xs sm:text-sm w-full sm:w-auto cursor-pointer"
              >
                Klik untuk skip ▶
              </button>
            )}
          </div>

        </div>
      </div>
    );
  }


  // ── GAMEOVER ───────────────────────────────────────────────────────────────

  if (phase === 'gameover') {
    const isUnlimited = endlessN > 1;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0a0005] relative overflow-hidden select-none">
        <div className="absolute inset-0 overdrive-bg opacity-60" />
        <div className="relative z-10 w-full max-w-md crt-arcade-frame bg-[#0d0010] border-4 border-purple-700 rounded-2xl p-6 text-center shadow-2xl">
          <div className="text-5xl mb-3">{isUnlimited ? '🏆' : '💔'}</div>
          <h2 className="font-pixel text-2xl sm:text-3xl text-purple-300 mb-1">
            {isUnlimited ? 'HIGH SCORE UNLIMITED' : 'PERTARUNGAN SELESAI'}
          </h2>
          <p className="font-pixel text-stone-400 text-sm sm:text-base mb-5">
            {isUnlimited ? `Kamu bertahan hingga Soal #${endlessN - 1}!` : 'Kamu kehabisan tenaga...'}
          </p>

          <div className="bg-black/60 border border-purple-800 rounded-xl p-4 mb-5 space-y-2 font-pixel">
            <div className="flex justify-between text-base">
              <span className="text-stone-400">{isUnlimited ? 'High Score Score:' : 'Total Damage:'}</span>
              <span className="text-amber-300 font-bold">{totalScore.toLocaleString()}</span>
            </div>
            {isUnlimited ? (
              <div className="flex justify-between text-base">
                <span className="text-stone-400">Soal Dijawab:</span>
                <span className="text-cyan-300 font-bold">{endlessN - 1} Soal</span>
              </div>
            ) : (
              <div className="flex justify-between text-base">
                <span className="text-stone-400">Sombo HP Sisa:</span>
                <span className="text-red-400 font-bold">{bossHp.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-base">
              <span className="text-stone-400">Streak Tertinggi:</span>
              <span className="text-amber-400 font-bold">{maxCombo}x</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowAnalysisModal(true)}
              className="btn-pixel !bg-amber-800 hover:!bg-amber-700 !border-amber-500 text-amber-100 w-full py-3 text-sm sm:text-base font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <span>📊</span>
              <span>ANALISIS KESALAHAN ({mistakes.length})</span>
            </button>

            <button
              onClick={() => resetGameState()}
              className="btn-pixel !bg-red-900 hover:!bg-red-800 !border-red-600 text-red-200 w-full py-3 text-sm sm:text-base font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🔄</span>
              <span>COBA LAGI</span>
            </button>

            <button
              onClick={() => setScreen('background_select')}
              className="btn-pixel !bg-stone-800 hover:!bg-stone-700 !border-stone-600 text-stone-300 w-full py-3 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>◀</span>
              <span>PILIH TEMPAT BELAJAR</span>
            </button>
          </div>
        </div>

        {/* Modal Overlay inside early return */}
        {renderAnalysisModal()}
      </div>
    );
  }

  // ── DEFEATED (Sombo kalah) ─────────────────────────────────────────────────

  if (phase === 'defeated') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden select-none"
        style={{
          backgroundImage: 'url(/backgrounds/classroom_battle.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/75" />
        <div className="crt-scanlines-overlay" />
        {showFlash && <div className="screen-flash" />}

        <div className="relative z-10 text-center mb-4">
          <div className="inline-block bg-emerald-800 border-4 border-emerald-400 px-5 py-1.5 rounded-full shadow-xl">
            <span className="font-pixel text-emerald-200 text-base sm:text-xl tracking-widest uppercase">
              🏆 SOMBO DIKALAHKAN!
            </span>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-3xl crt-arcade-frame bg-[#040d05] border-4 border-emerald-800 rounded-2xl p-4 sm:p-6 shadow-2xl">
          <div className="flex flex-row items-end gap-4 sm:gap-8 mb-5">

            {/* Player character (triumphant) */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <PixelSprite character={character} pixelSize={0.34} animate />
              <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-pixel text-sm px-2 py-0.5 rounded shadow">
                {studentName || 'Petualang'}
              </div>
            </div>

            {/* Defeated speech bubble (beak points RIGHT to Sombo) */}
            <div className="flex-1 flex flex-col items-start gap-2">
              <div className="boss-bubble boss-bubble-right px-6 sm:px-8 py-4 sm:py-5 shadow-xl w-full border-red-400/60">
                <p className="font-pixel text-lg sm:text-2xl md:text-3xl text-stone-900 leading-snug sm:leading-relaxed font-bold tracking-wide px-3 sm:px-5">
                  {defeatText}
                  {defeatTyping && <span className="animate-pulse">▋</span>}
                </p>
              </div>
            </div>

            {/* Sombo sprite — defeated, scaleX(-1) faces left, physically shifted left via right margin */}
            <div className="shrink-0 flex flex-col items-center gap-2 mr-6 sm:mr-10 md:mr-14">
              <div className="h-24 sm:h-32 flex items-end justify-center">
                <img
                  src="/sprites/boss_defeated.png"
                  alt="Sombo Defeated"
                  className="h-full w-auto object-contain"
                  style={{
                    imageRendering: 'pixelated',
                    filter: WHITE_CELL_SHADING,
                    transform: 'scaleX(-1)',
                  }}
                />
              </div>
              <div className="bg-red-950/90 border border-red-500/50 text-red-300 font-pixel font-bold text-xs sm:text-sm px-2 py-0.5 rounded shadow">
                SOMBO KALAH!
              </div>
            </div>

          </div>

          {/* Stats & Proceed */}
          <div className="bg-black/60 border border-emerald-900 rounded-xl p-3.5 mb-4 grid grid-cols-2 gap-2 font-pixel text-base sm:text-lg">
            <div className="text-stone-400">Total Damage:</div>
            <div className="text-amber-300 font-bold text-right">{totalScore.toLocaleString()}</div>
            <div className="text-stone-400">HP Tersisa:</div>
            <div className="text-emerald-400 font-bold text-right">{playerHp} HP</div>
          </div>

          {!defeatTyping && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setShowAnalysisModal(true)}
                className="btn-pixel !bg-amber-800 hover:!bg-amber-700 !border-amber-500 text-amber-100 px-6 py-3 text-sm sm:text-base font-bold shadow-xl flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
              >
                <span>📊</span>
                <span>ANALISIS KESALAHAN ({mistakes.length})</span>
              </button>

              <button
                onClick={() => {
                  setShowFlash(true);
                  setTimeout(() => setShowFlash(false), 500);
                  setTimeout(() => startEndless(), 250);
                }}
                className="btn-pixel !bg-purple-900 hover:!bg-purple-800 !border-purple-500 text-purple-200 px-6 py-3 text-sm sm:text-base font-bold shadow-xl flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
              >
                <span>⚡</span>
                <span>UNLIMITED MATH BATTLE</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Overlay inside early return */}
        {renderAnalysisModal()}
      </div>
    );
  }

  // ── BATTLE / ENDLESS ───────────────────────────────────────────────────────

  const isEndless = phase === 'endless';
  const bgClass   = isEndless ? 'overdrive-bg' : '';
  const bgStyle   = isEndless
    ? {}
    : {
        backgroundImage: 'url(/backgrounds/classroom_battle.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between relative overflow-hidden select-none ${bgClass} ${rageShake ? 'boss-rage-shake' : ''}`}
      style={bgStyle}
    >
      {/* Overlays */}
      {!isEndless && <div className="absolute inset-0 bg-black/65 pointer-events-none" />}
      {isEndless && <div className="absolute inset-0 overdrive-grid pointer-events-none opacity-80" />}
      <div className="crt-scanlines-overlay" />
      {showFlash && <div className="screen-flash" />}

      {/* Floating damage numbers */}
      <div className="absolute inset-0 pointer-events-none z-50">
        {floatDmgs.map(d => (
          <div
            key={d.id}
            className={`floating-dmg ${d.isCritical ? 'floating-dmg-critical' : 'floating-dmg-normal'}`}
            style={{ left: `${d.x}%`, top: '35%' }}
          >
            {d.value}
          </div>
        ))}
      </div>

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div className="relative z-20 p-2.5 sm:p-3 bg-black/90 border-b-2 border-red-950 flex flex-col gap-2 font-pixel">

        {/* Mode Label & Audio Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className={`retro-pill-badge text-xs sm:text-sm py-1 px-3 font-pixel font-bold ${
            isEndless
              ? '!bg-purple-950 !border-purple-500 text-purple-300'
              : '!bg-red-950 !border-red-600 text-red-300'
          }`}>
            {isEndless ? `⚡ UNLIMITED MATH BATTLE — SOAL #${endlessN}` : `⚔️ PERTARUNGAN SOMBO — SOAL #${questionNumber}${questionNumber >= 15 ? ' 🔥 TIER TERSULIT' : ''}`}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Audio Mute/Unmute Controls */}
            <button
              onClick={() => {
                const muted = toggleBgmMute();
                setBgmMutedState(muted);
              }}
              className={`btn-pixel text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 flex items-center gap-1 cursor-pointer ${
                bgmMutedState ? '!bg-red-950 !border-red-600 text-red-300' : '!bg-stone-800 !border-amber-600 text-amber-300'
              }`}
              title={bgmMutedState ? 'Unmute Musik BGM' : 'Mute Musik BGM'}
            >
              <span>{bgmMutedState ? '🔇 BGM' : '🎵 BGM'}</span>
            </button>

            <button
              onClick={() => {
                const muted = toggleSfxMute();
                setSfxMutedState(muted);
              }}
              className={`btn-pixel text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 flex items-center gap-1 cursor-pointer ${
                sfxMutedState ? '!bg-red-950 !border-red-600 text-red-300' : '!bg-stone-800 !border-amber-600 text-amber-300'
              }`}
              title={sfxMutedState ? 'Unmute SFX' : 'Mute SFX'}
            >
              <span>{sfxMutedState ? '🔇 SFX' : '🔊 SFX'}</span>
            </button>

            {/* Score */}
            <div className="flex items-center gap-1 font-pixel text-base sm:text-xl font-bold text-amber-300 ml-1">
              <span>🏆</span>
              <span>{totalScore.toLocaleString()}</span>
            </div>
          </div>
        </div>



        {/* Timer Bar */}
        {question && (
          <div>
            <div className="flex justify-between mb-0.5 font-pixel text-xs font-bold text-stone-300">
              <span>⏱ WAKTU</span>
              <span>{timeLeft.toFixed(1)}s</span>
            </div>
            <div className="h-3 sm:h-4 w-full bg-black/60 border border-stone-800 rounded overflow-hidden">
              <div
                className={`h-full rounded transition-none ${timerClass(timePct)}`}
                style={{ width: `${timePct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN CENTER ARENA: Question & Answers Centered in Screen ──────────── */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center p-3 sm:p-5 my-auto w-full">

        {/* Question & Options Center Container with distinct vertical gap */}
        <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center gap-5 sm:gap-8 md:gap-10 my-auto mb-8 sm:mb-4">
          
          {/* Question Box */}
          {question && (
            <div className="boss-question-box w-full p-4 sm:p-6 text-center shadow-2xl overflow-hidden">
              {/* Combo badge */}
              {combo >= 2 && (
                <div className="combo-pop inline-block bg-amber-700 border border-amber-400 text-amber-100 font-pixel font-bold text-xs sm:text-sm px-3 py-0.5 rounded-full mb-3 shadow">
                  🔥 {combo}x STREAK!
                </div>
              )}

              {/* High contrast, ultra-legible pixelated CRT math font ('VT323') */}
              <div
                className="text-5xl sm:text-7xl md:text-8xl text-amber-300 font-bold tracking-wider mb-1 leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] max-w-full overflow-hidden text-ellipsis whitespace-nowrap px-2"
                style={{ fontFamily: "'VT323', monospace" }}
              >
                {question.a}
                <span className="text-red-400 mx-2 sm:mx-4">{question.op}</span>
                {question.b}
                <span className="text-stone-400 mx-2 sm:mx-3">=</span>
                <span className="text-stone-500">?</span>
              </div>

              {question.hasCarryBorrow && (
                <div className="font-pixel text-xs sm:text-sm font-bold text-red-400 opacity-90 mt-1">
                  {question.op === '+' ? '★ Simpan (Carrying)' : '★ Pinjam (Borrowing)'}
                </div>
              )}
            </div>
          )}

          {/* Answer Options Grid */}
          {question && (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full">
              {question.options.map((opt, idx) => {
                let btnClass = '';
                if (answered !== null) {
                  if (opt === question.answer) btnClass = 'correct';
                  else if (opt === answered) btnClass = 'wrong';
                }
                return (
                  <button
                    key={`q-opt-${question.a}-${question.b}-${idx}`}
                    className={`boss-answer-btn ${btnClass}`}
                    disabled={answered !== null}
                    onClick={() => handleAnswer(opt)}
                    style={{ fontFamily: "'VT323', monospace" }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

        </div>

        {/* Bottom Stage Row: Player on Left, Sombo on Right (synchronized size!) */}
        <div className="w-full max-w-4xl flex items-end justify-between gap-4 mt-auto pt-8 sm:pt-4 pb-3 sm:pb-2">

          {/* Player character + HP hearts */}
          <div className="flex flex-col items-center gap-1">
            <PixelSprite character={character} pixelSize={0.33} animate />
            <div className="flex gap-1">
              {[1, 2, 3].map((h) => (
                <span
                  key={h}
                  className={`text-2xl sm:text-3xl ${heartAnim && h === heartCount + 1 ? 'heart-damage' : ''}`}
                >
                  {h <= heartCount ? '❤️' : '🖤'}
                </span>
              ))}
            </div>
            <div className="font-pixel font-bold text-xs text-stone-300">{playerHp} HP</div>
          </div>

          {/* Question / Endless info center */}
          <div className="text-center font-pixel font-bold text-stone-300 text-xs sm:text-sm hidden sm:block">
            {isEndless ? (
              <span className="text-purple-400">⚡ OVERDRIVE<br />Soal #{endlessN}</span>
            ) : (
              <span className="text-red-400">⚔️ SOAL #{questionNumber}<br />{questionNumber >= 15 ? '🔥 TIER TERSULIT' : ''}</span>
            )}
          </div>

          {/* Sombo sprite + Proportional Health Bar directly under Sombo */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="h-36 sm:h-48 flex items-end justify-center">
              <img
                src="/sprites/boss_challenging.png"
                alt="Sombo"
                className="h-full w-auto object-contain"
                style={{
                  imageRendering: 'pixelated',
                  filter: WHITE_CELL_SHADING,
                  transform: 'scaleX(-1)',
                }}
              />
            </div>

            {/* Proportional Sombo HP Bar directly under Sombo */}
            {!isEndless && (
              <div className="w-36 sm:w-48 flex flex-col items-center gap-0.5 font-pixel">
                <div className="flex items-center justify-between w-full text-[11px] sm:text-xs font-bold text-red-300 px-0.5">
                  <span>SOMBO</span>
                  <span>{bossHp.toLocaleString()} HP</span>
                </div>
                <div className="boss-hp-bar-bg h-3.5 sm:h-4 w-full rounded border border-red-900 overflow-hidden shadow-md">
                  <div
                    className="boss-hp-bar h-full transition-all duration-300"
                    style={{ width: `${bossPct}%` }}
                  />
                </div>
              </div>
            )}
            {isEndless && (
              <div className="bg-red-950/90 border border-red-500/50 text-red-300 font-pixel font-bold text-xs px-2.5 py-0.5 rounded shadow">
                SOMBO
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ── BOTTOM BAR ──────────────────────────────────────────────────────── */}
      <div className="relative z-20 p-2 sm:p-3 bg-black/90 border-t-2 border-red-950 flex items-center justify-between font-pixel text-xs sm:text-sm text-stone-300">
        <div className="flex items-center gap-1.5 font-bold">
          <span className={`w-2 h-2 rounded-full ${isEndless ? 'bg-purple-400' : 'bg-red-400'} animate-pulse`} />
          <span>{isEndless ? 'UNLIMITED MATH' : `PERTARUNGAN SOMBO — SOAL #${questionNumber}`}</span>
        </div>
        <div className="text-stone-400 font-medium">Combo: <span className="text-amber-400 font-bold">{combo}x</span></div>
        <button
          onClick={() => setScreen('background_select')}
          className="btn-pixel !bg-stone-800 hover:!bg-stone-700 !border-stone-600 text-stone-300 px-3 py-1 text-xs inline-flex items-center gap-1.5 cursor-pointer"
        >
          <span>◀</span>
          <span>PILIH TEMPAT BELAJAR</span>
        </button>
      </div>

      {/* ── ANALISIS KESALAHAN MODAL ─────────────────────────────────────────── */}
      {renderAnalysisModal()}

    </div>
  );
}
