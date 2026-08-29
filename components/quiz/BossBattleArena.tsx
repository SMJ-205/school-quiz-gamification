'use client';

/**
 * BossBattleArena.tsx
 * QuickMath Arithmo-Boss Battle — Ruang Kelas Unggulan
 *
 * Phases:
 *  1. INTRO   — Comic cutscene: boss menantang player
 *  2. BATTLE  — 10 Wave boss fight, soal 2-digit +/−, timer dinamis
 *  3. DEFEATED — Boss kalah, speech bubble, transisi ke Endless
 *  4. ENDLESS  — Survival tanpa batas, timer menyusut eksponensial
 *  5. GAMEOVER — Player HP = 0, layar skor
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import PixelSprite from '../PixelSprite';
import { sfxCorrect, sfxWrong, sfxTextBlip, unlockAudioEngine } from '@/lib/audioEngine';

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

// ─── Constants ─────────────────────────────────────────────────────────────────

const BOSS_MAX_HP = 4000;
const PLAYER_MAX_HP = 100;

// Wave → HP threshold: Boss loses this much HP per wave completion
const WAVE_PHASES = [
  { waves: [1, 2, 3], hpTarget: 3000 },
  { waves: [4, 5, 6], hpTarget: 1800 },
  { waves: [7, 8, 9], hpTarget: 400  },
  { waves: [10],       hpTarget: 0    },
];

const INTRO_SPEECH =
  'Heh, kalian semua cuma buang-buang waktu kalau mikir bisa ngalahin aku. ' +
  'Otak jeniusku ini beda kelas! ' +
  'Berani adu hitung cepat lawan aku? ' +
  'Cuma butuh beberapa babak tantangan buat bikin kalian sadar batas kemampuan kalian!';

const DEFEATED_SPEECH =
  'Aaargh! tidak mungkin aku bisa dikalahkan olehmu. ' +
  'Apakah rajin-mu bisa mengalahkan bakat-ku?';

// ─── Question Generator ────────────────────────────────────────────────────────

function hasCarrying(a: number, b: number): boolean {
  return (a % 10) + (b % 10) >= 10;
}
function hasBorrowing(a: number, b: number): boolean {
  return (a % 10) < (b % 10);
}

function genQuestion(wave: number): BossQuestion {
  // Wave determines difficulty
  const isEarly  = wave <= 3;
  const isMid    = wave >= 4 && wave <= 6;
  const isFierce = wave >= 7;

  let a: number, b: number, op: '+' | '-', carry: boolean;
  let timeLimit: number;

  if (isEarly) {
    // Simple addition, no carry
    op = '+';
    do {
      a = 10 + Math.floor(Math.random() * 80); // 10..89
      b = 10 + Math.floor(Math.random() * (99 - a));
    } while (hasCarrying(a, b));
    carry = false;
    timeLimit = 6.0;
  } else if (isMid) {
    // Mixed, 50% with carry/borrow
    op = Math.random() < 0.5 ? '+' : '-';
    carry = Math.random() < 0.5;
    if (op === '+') {
      do {
        a = 10 + Math.floor(Math.random() * 80);
        b = 10 + Math.floor(Math.random() * Math.min(90, 99 - a));
      } while (hasCarrying(a, b) !== carry);
    } else {
      do {
        a = 20 + Math.floor(Math.random() * 70);
        b = 10 + Math.floor(Math.random() * (a - 10));
      } while (hasBorrowing(a, b) !== carry);
    }
    timeLimit = 5.0;
  } else {
    // Fierce/climax: dominan carry/borrow
    op = Math.random() < 0.5 ? '+' : '-';
    carry = true;
    if (op === '+') {
      do {
        a = 30 + Math.floor(Math.random() * 60);
        b = 10 + Math.floor(Math.random() * Math.min(60, 99 - a));
      } while (!hasCarrying(a, b));
    } else {
      do {
        a = 30 + Math.floor(Math.random() * 60);
        b = 10 + Math.floor(Math.random() * (a - 10));
      } while (!hasBorrowing(a, b));
    }
    timeLimit = wave === 10 ? 3.8 : 4.2;
  }

  const answer = op === '+' ? a + b : a - b;
  const diffFactor = carry ? 1.35 : 1.0;

  // Generate 4 unique options including correct answer
  const opts = new Set<number>();
  opts.add(answer);
  while (opts.size < 4) {
    const delta = Math.floor(Math.random() * 20) - 10;
    const fake = answer + delta;
    if (fake !== answer && fake > 0 && fake < 200) opts.add(fake);
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
  const [wave, setWave]             = useState(1);
  const [combo, setCombo]           = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [question, setQuestion]     = useState<BossQuestion | null>(null);
  const [answered, setAnswered]     = useState<number | null>(null);
  const [timeLeft, setTimeLeft]     = useState(0);
  const [timePct, setTimePct]       = useState(100);
  const [floatDmgs, setFloatDmgs]   = useState<FloatDmg[]>([]);
  const [showFlash, setShowFlash]   = useState(false);
  const [rageShake, setRageShake]   = useState(false);
  const [heartAnim, setHeartAnim]   = useState(false);
  const [heartCount, setHeartCount] = useState(3); // 3 = full, 2, 1, 0

  // Endless state
  const [endlessN, setEndlessN]     = useState(1);
  const [endlessScore, setEndlessScore] = useState(0);

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
    const x = 30 + Math.random() * 40; // random x 30%..70%
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

  // Compute hearts from HP
  function hpToHearts(hp: number): number {
    if (hp > 75) return 3;
    if (hp > 50) return 2;
    if (hp > 25) return 1;
    return 0;
  }

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

  const loadQuestion = useCallback((currentWave: number) => {
    const q = genQuestion(currentWave);
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

  // Start battle
  useEffect(() => {
    if (phase !== 'battle') return;
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
    if (answered !== null) return;
    setAnswered(-1);
    sfxWrong();
    triggerHeartDamage();
    const newHp = Math.max(0, playerHp - 30);
    setPlayerHp(newHp);
    setHeartCount(hpToHearts(newHp));
    setCombo(0);
    addFloat('TIMEOUT!', false);
    if (wave >= 4) triggerRage();
    if (newHp <= 0) {
      setTimeout(() => setPhase('gameover'), 1000);
    } else {
      setTimeout(() => afterAnswer(), 1000);
    }
  }

  // ─── Answer Handler ───────────────────────────────────────────────────────────

  function handleAnswer(opt: number) {
    if (answered !== null || !question) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsed = (Date.now() - startTime.current) / 1000;
    setAnswered(opt);

    if (opt === question.answer) {
      sfxCorrect();
      // Compute damage
      const speedMult = 1.0 + (qTimeLimit.current - elapsed) / qTimeLimit.current;
      const comboMult = 1.0 + Math.min(combo, 10) * 0.1;
      const dmg = Math.round(100 * speedMult * comboMult * question.difficultyFactor);
      const isCritical = speedMult > 1.6;

      const newBossHp = Math.max(0, bossHp - dmg);
      setBossHp(newBossHp);

      const newCombo = combo + 1;
      setCombo(newCombo);
      setTotalScore(s => s + dmg);

      if (isCritical) {
        addFloat(`⚡ ${dmg} CRITICAL!`, true);
      } else {
        addFloat(`-${dmg}`, false);
      }

      // Streak regen: every 5 correct
      if (newCombo % 5 === 0) {
        const regenHp = Math.min(PLAYER_MAX_HP, playerHp + 15);
        setPlayerHp(regenHp);
        setHeartCount(hpToHearts(regenHp));
        addFloat('+15 HP ❤️', false);
      }

      if (newBossHp <= 0) {
        setTimeout(() => {
          setShowFlash(true);
          setTimeout(() => setShowFlash(false), 600);
          setTimeout(() => setPhase('defeated'), 300);
        }, 700);
        return;
      }

      // Wave advancement
      const hpThresholds = [4000, 3000, 1800, 400, 0];
      const targetWave   = 10 - Math.floor((newBossHp / BOSS_MAX_HP) * 10);
      const newWave      = Math.max(wave, Math.min(10, targetWave + 1));
      if (newWave !== wave) setWave(newWave);

      setTimeout(() => afterAnswer(), 700);
    } else {
      sfxWrong();
      triggerHeartDamage();
      const newHp = Math.max(0, playerHp - 25);
      setPlayerHp(newHp);
      setHeartCount(hpToHearts(newHp));
      setCombo(0);
      addFloat('SALAH! -25', false);
      if (wave >= 4) triggerRage();
      if (newHp <= 0) {
        setTimeout(() => setPhase('gameover'), 900);
        return;
      }
      setTimeout(() => afterAnswer(), 700);
    }
  }

  function afterAnswer() {
    if (phase === 'battle') {
      loadQuestion(wave);
    } else if (phase === 'endless') {
      const nextN = endlessN + 1;
      setEndlessN(nextN);
      loadEndlessQuestion(nextN);
    }
  }

  // ─── Endless Start ────────────────────────────────────────────────────────────

  function startEndless() {
    setEndlessN(1);
    setEndlessScore(0);
    setPhase('endless');
    setCombo(0);
    // Player carries remaining HP into endless
    loadEndlessQuestion(1);
  }

  useEffect(() => {
    if (phase !== 'endless' || !question) return;
    // update endless score for correct answers tracked via totalScore updates
  }, [phase, question]);

  // ─── Timer Color ──────────────────────────────────────────────────────────────

  function timerClass(pct: number): string {
    if (pct > 60) return 'timer-bar-green';
    if (pct > 30) return 'timer-bar-yellow';
    return `timer-bar-red ${pct <= 29 ? 'timer-bar-blink' : ''}`;
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  const bossPct = Math.max(0, (bossHp / BOSS_MAX_HP) * 100);

  // ── INTRO ──────────────────────────────────────────────────────────────────

  if (phase === 'intro') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
        style={{
          backgroundImage: 'url(/backgrounds/classroom_battle.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/70" />
        {showFlash && <div className="screen-flash" />}

        {/* Comic Battle Title */}
        <div className="relative z-10 text-center mb-4">
          <div className="inline-block bg-red-700 border-4 border-red-400 px-6 py-1.5 rounded-full shadow-xl mb-2">
            <span className="font-pixel text-white text-base sm:text-xl tracking-widest">
              ⚔️ RUANG KELAS UNGGULAN — BOSS BATTLE
            </span>
          </div>
        </div>

        {/* Comic Panel: Boss (right) vs Player (left) */}
        <div className="relative z-10 w-full max-w-3xl crt-arcade-frame bg-[#0d0505] border-4 border-red-900 rounded-2xl p-4 sm:p-6 shadow-2xl">
          <div className="flex flex-row items-end gap-4 sm:gap-8 mb-5">

            {/* Player character (left) */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <PixelSprite character={character} pixelSize={0.45} animate />
              <div className="bg-black/70 border border-amber-500/40 text-amber-300 font-dialogue text-sm px-2 py-0.5 rounded">
                👤 {studentName || 'Petualang'}
              </div>
            </div>

            {/* Boss speech bubble (pointing RIGHT, toward boss) */}
            <div className="flex-1 flex flex-col items-start gap-2">
              <div className="boss-bubble px-4 py-3 shadow-xl mr-4 w-full">
                <p className="font-dialogue text-base sm:text-xl text-[#1a0808] leading-snug">
                  {introText}
                  {introTyping && <span className="animate-pulse">▋</span>}
                </p>
              </div>
            </div>

            {/* Boss sprite (right) */}
            <div className="shrink-0 flex flex-col items-center gap-2 scale-x-[-1]">
              <div className="relative">
                <img
                  src="/sprites/boss_challenging.jpg"
                  alt="Boss"
                  className="w-24 sm:w-32 object-contain drop-shadow-2xl"
                  style={{ imageRendering: 'pixelated' }}
                />
                {/* CSS mouth overlay on boss */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: '48%',
                    bottom: '61%',
                    transform: 'translate(-50%, 50%)',
                    width: bossMouth ? '14%' : '11%',
                    height: bossMouth ? '5%' : '2%',
                    borderRadius: '50%',
                    backgroundColor: bossMouth ? 'rgba(20,5,5,0.95)' : 'rgba(45,18,10,0.82)',
                    transition: 'height 55ms ease, width 55ms ease',
                    pointerEvents: 'none',
                  }}
                />
              </div>
              <div className="bg-red-950/80 border border-red-500/40 text-red-300 font-dialogue text-sm px-2 py-0.5 rounded scale-x-[-1]">
                😤 SI JENIUS
              </div>
            </div>

          </div>

          {/* Start Button */}
          <div className="text-center">
            {!introTyping && (
              <button
                onClick={() => {
                  unlockAudioEngine();
                  setShowFlash(true);
                  setTimeout(() => setShowFlash(false), 400);
                  setTimeout(() => setPhase('battle'), 200);
                }}
                className="btn-pixel !bg-red-800 hover:!bg-red-700 !border-red-500 text-white px-8 py-3 text-base sm:text-xl shadow-xl"
              >
                ⚔️ TERIMA TANTANGAN
              </button>
            )}
            {introTyping && (
              <button
                onClick={() => {
                  if (introTimerRef.current) clearInterval(introTimerRef.current);
                  setIntroText(INTRO_SPEECH);
                  setIntroTyping(false);
                  setBossMouth(false);
                }}
                className="btn-pixel !bg-stone-800 !border-stone-600 text-stone-400 px-6 py-2 text-sm"
              >
                Klik untuk lanjutkan ▶
              </button>
            )}
            <button
              onClick={() => setScreen('background_select')}
              className="ml-3 text-stone-500 font-dialogue text-sm underline hover:text-stone-300 transition-colors"
            >
              ← Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── GAMEOVER ───────────────────────────────────────────────────────────────

  if (phase === 'gameover') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0a0005] relative overflow-hidden">
        <div className="absolute inset-0 overdrive-bg opacity-60" />
        <div className="relative z-10 w-full max-w-md crt-arcade-frame bg-[#0d0010] border-4 border-purple-700 rounded-2xl p-6 text-center shadow-2xl">
          <div className="text-5xl mb-3">💔</div>
          <h2 className="font-pixel text-2xl sm:text-3xl text-red-400 mb-1">PERTARUNGAN SELESAI</h2>
          <p className="font-dialogue text-stone-400 text-lg mb-5">Kamu kehabisan tenaga...</p>

          <div className="bg-black/60 border border-purple-800 rounded-xl p-4 mb-5 space-y-2">
            <div className="flex justify-between font-dialogue text-lg">
              <span className="text-stone-400">Total Damage ke Boss:</span>
              <span className="text-amber-300 font-bold">{totalScore.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-dialogue text-lg">
              <span className="text-stone-400">Boss HP Sisa:</span>
              <span className="text-red-400 font-bold">{bossHp.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-dialogue text-lg">
              <span className="text-stone-400">Wave Tertinggi:</span>
              <span className="text-purple-300 font-bold">Wave {wave}</span>
            </div>
            {phase === 'gameover' && endlessN > 1 && (
              <div className="flex justify-between font-dialogue text-lg">
                <span className="text-stone-400">Soal Endless:</span>
                <span className="text-cyan-300 font-bold">{endlessN - 1}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setBossHp(BOSS_MAX_HP);
                setPlayerHp(PLAYER_MAX_HP);
                setHeartCount(3);
                setWave(1);
                setCombo(0);
                setTotalScore(0);
                setPhase('intro');
              }}
              className="btn-pixel !bg-red-900 hover:!bg-red-800 !border-red-600 text-red-200 w-full py-3 text-base"
            >
              🔄 COBA LAGI
            </button>
            <button
              onClick={() => setScreen('background_select')}
              className="btn-pixel !bg-stone-800 !border-stone-600 text-stone-300 w-full py-3 text-sm"
            >
              ← Pilih Tempat Belajar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── DEFEATED (Boss kalah) ─────────────────────────────────────────────────

  if (phase === 'defeated') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
        style={{
          backgroundImage: 'url(/backgrounds/classroom_battle.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/75" />
        {showFlash && <div className="screen-flash" />}

        <div className="relative z-10 text-center mb-4">
          <div className="inline-block bg-emerald-800 border-4 border-emerald-400 px-5 py-1.5 rounded-full shadow-xl">
            <span className="font-pixel text-emerald-200 text-base sm:text-xl tracking-widest">
              🏆 BOSS DIKALAHKAN!
            </span>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-3xl crt-arcade-frame bg-[#040d05] border-4 border-emerald-800 rounded-2xl p-4 sm:p-6 shadow-2xl">
          {/* Boss defeated layout */}
          <div className="flex flex-row items-end gap-4 sm:gap-8 mb-5">

            {/* Player character (triumphant) */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <PixelSprite character={character} pixelSize={0.45} animate />
              <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-dialogue text-sm px-2 py-0.5 rounded">
                🏆 {studentName || 'Petualang'}
              </div>
            </div>

            {/* Defeated speech bubble → boss */}
            <div className="flex-1 flex flex-col items-start gap-2">
              <div className="boss-bubble px-4 py-3 shadow-xl mr-4 w-full border-red-400/60">
                <p className="font-dialogue text-base sm:text-xl text-[#1a0808] leading-snug">
                  {defeatText}
                  {defeatTyping && <span className="animate-pulse">▋</span>}
                </p>
              </div>
            </div>

            {/* Boss sprite — defeated, mirrored */}
            <div className="shrink-0 flex flex-col items-center gap-2">
              <img
                src="/sprites/boss_defeated.jpg"
                alt="Boss Defeated"
                className="w-20 sm:w-28 object-contain drop-shadow-2xl"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="bg-red-950/80 border border-red-500/40 text-red-400 font-dialogue text-sm px-2 py-0.5 rounded">
                😭 KALAH!
              </div>
            </div>

          </div>

          {/* Stats & Proceed */}
          <div className="bg-black/50 border border-emerald-900 rounded-xl p-3 mb-4 grid grid-cols-2 gap-2 font-dialogue text-base sm:text-lg">
            <div className="text-stone-400">Total Damage:</div>
            <div className="text-amber-300 font-bold text-right">{totalScore.toLocaleString()}</div>
            <div className="text-stone-400">HP Tersisa:</div>
            <div className="text-emerald-400 font-bold text-right">{playerHp} HP</div>
          </div>

          {!defeatTyping && (
            <div className="text-center">
              <button
                onClick={() => {
                  setShowFlash(true);
                  setTimeout(() => setShowFlash(false), 500);
                  setTimeout(() => startEndless(), 250);
                }}
                className="btn-pixel !bg-purple-900 hover:!bg-purple-800 !border-purple-500 text-purple-200 px-8 py-3 text-base sm:text-xl shadow-xl"
              >
                ⚡ OVERDRIVE MODE — LANJUTKAN!
              </button>
            </div>
          )}
        </div>
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
      className={`min-h-screen flex flex-col relative overflow-hidden ${bgClass} ${rageShake ? 'boss-rage-shake' : ''}`}
      style={bgStyle}
    >
      {/* Overlays */}
      {!isEndless && <div className="absolute inset-0 bg-black/65 pointer-events-none" />}
      {isEndless && <div className="absolute inset-0 overdrive-grid pointer-events-none opacity-80" />}
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
      <div className="relative z-20 p-2 sm:p-3 bg-black/85 border-b-2 border-red-950 flex flex-col gap-2">

        {/* Mode Label */}
        <div className="flex items-center justify-between">
          <div className={`retro-pill-badge text-xs sm:text-sm py-1 px-3 ${
            isEndless
              ? '!bg-purple-950 !border-purple-500 text-purple-300'
              : '!bg-red-950 !border-red-600 text-red-300'
          }`}>
            {isEndless ? `⚡ OVERDRIVE MODE — SOAL #${endlessN}` : `⚔️ WAVE ${wave}/10`}
          </div>
          <div className="flex items-center gap-1.5 font-dialogue text-base sm:text-xl text-amber-300">
            <span>🏆</span>
            <span>{totalScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Boss HP Bar */}
        {!isEndless && (
          <div>
            <div className="flex justify-between mb-1 font-dialogue text-xs sm:text-sm text-red-400">
              <span>😤 SI JENIUS — {bossHp.toLocaleString()} HP</span>
              <span>{Math.round(bossPct)}%</span>
            </div>
            <div className="boss-hp-bar-bg h-4 sm:h-5 w-full">
              <div
                className="boss-hp-bar h-full"
                style={{ width: `${bossPct}%` }}
              />
            </div>
          </div>
        )}
        {isEndless && (
          <div className="text-center font-dialogue text-sm text-purple-300">
            ⏳ Timer menyusut... bertahan selama mungkin!
          </div>
        )}

        {/* Timer Bar */}
        {question && (
          <div>
            <div className="flex justify-between mb-0.5 font-dialogue text-xs text-stone-400">
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

      {/* ── MAIN ARENA ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-3 sm:p-5">

        {/* Question Box */}
        {question && (
          <div className="boss-question-box max-w-xl mx-auto w-full p-4 sm:p-6 text-center mb-4">
            {/* Combo badge */}
            {combo >= 2 && (
              <div className="combo-pop inline-block bg-amber-700 border border-amber-400 text-amber-200 font-pixel text-xs sm:text-sm px-3 py-0.5 rounded-full mb-2 shadow">
                🔥 {combo}x STREAK!
              </div>
            )}

            {/* The math question */}
            <div className="font-pixel text-4xl sm:text-6xl md:text-7xl text-white font-black tracking-wider mb-2 leading-none">
              {question.a}
              <span className="text-red-400 mx-2 sm:mx-4">{question.op}</span>
              {question.b}
              <span className="text-stone-500 mx-2">=</span>
              <span className="text-stone-600">?</span>
            </div>

            {question.hasCarryBorrow && (
              <div className="font-dialogue text-xs text-red-500 mb-1 opacity-80">
                {question.op === '+' ? '★ Simpan' : '★ Pinjam'}
              </div>
            )}
          </div>
        )}

        {/* Answer Options */}
        {question && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-xl mx-auto w-full mb-4">
            {question.options.map((opt) => {
              let btnClass = '';
              if (answered !== null) {
                if (opt === question.answer) btnClass = 'correct';
                else if (opt === answered) btnClass = 'wrong';
              }
              return (
                <button
                  key={opt}
                  className={`boss-answer-btn ${btnClass}`}
                  disabled={answered !== null}
                  onClick={() => handleAnswer(opt)}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom row: player + hearts + boss sprite */}
        <div className="flex items-end justify-between gap-4">

          {/* Player character + HP hearts */}
          <div className="flex flex-col items-center gap-1">
            <PixelSprite character={character} pixelSize={0.35} animate />
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
            <div className="font-dialogue text-xs text-stone-400">{playerHp} HP</div>
          </div>

          {/* Wave / Endless info */}
          <div className="text-center font-dialogue text-stone-400 text-sm hidden sm:block">
            {isEndless ? (
              <span className="text-purple-400">⚡ OVERDRIVE<br />Soal #{endlessN}</span>
            ) : (
              <span>Boss HP<br /><strong className="text-red-400">{bossHp.toLocaleString()}</strong></span>
            )}
          </div>

          {/* Boss sprite */}
          <div className="flex flex-col items-center gap-1 scale-x-[-1]">
            <img
              src="/sprites/boss_challenging.jpg"
              alt="Boss"
              className="w-20 sm:w-28 object-contain"
              style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 4px 16px rgba(220,38,38,0.6))' }}
            />
            <div className="text-red-400 font-dialogue text-xs scale-x-[-1]">SI JENIUS</div>
          </div>

        </div>

      </div>

      {/* ── BOTTOM BAR ──────────────────────────────────────────────────────── */}
      <div className="relative z-20 p-2 sm:p-3 bg-black/85 border-t-2 border-red-950 flex items-center justify-between font-dialogue text-xs sm:text-sm text-stone-400">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isEndless ? 'bg-purple-400' : 'bg-red-400'} animate-pulse`} />
          <span>{isEndless ? 'OVERDRIVE' : `WAVE ${wave}/10`}</span>
        </div>
        <div className="text-stone-500">Combo: <span className="text-amber-400 font-bold">{combo}x</span></div>
        <button
          onClick={() => setScreen('background_select')}
          className="text-stone-600 hover:text-stone-400 underline text-xs transition-colors"
        >
          Menyerah ↩
        </button>
      </div>

    </div>
  );
}
