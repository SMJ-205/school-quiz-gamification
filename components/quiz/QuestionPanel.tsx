'use client';

/**
 * QuestionPanel.tsx
 * Interactive RPG Comic Dialogue featuring Pak Guru (Teacher).
 * Features:
 * - Animated pixel teacher portrait with speaking animation & comic shout label
 * - Comic speech bubble with dynamic pointer tail
 * - Smooth typewriter text animation with sound blips and click-to-fast-forward
 * - Zero layout shifts on answering, fully responsive for all screen sizes
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/store/useGameStore';
import { sfxCorrect, sfxWrong, sfxTextBlip } from '@/lib/audioEngine';
import GuardianOwlModal from './GuardianOwlModal';

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

/**
 * ─── CONFIG ANIMASI MULUT GURU (TEACHER MOUTH CONFIG) ───────────────────────
 * Ubah koordinat & ukuran di bawah ini untuk kalibrasi animasi mulut Bu Guru / Pak Guru:
 * - female: Bu Guru (Perpustakaan Taman Pagi)
 * - male: Pak Guru (Perpustakaan Klasik)
 */
export const TEACHER_MOUTH_CONFIG = {
  female: {
    // Tampilan Desktop (>= 640px)
    desktop: {
      left: '41.8%',
      bottom: '59.9%',
      openWidth: '13%',
      closedWidth: '11%',
      openHeight: '4%',
      closedHeight: '1.8%',
    },
    // Tampilan Mobile (< 640px)
    mobile: {
      left: '40.8%',
      bottom: '56.5%',
      openWidth: '10%',
      closedWidth: '5%',
      openHeight: '4%',
      closedHeight: '1%',
    },
  },
  male: {
    // Tampilan Desktop (>= 640px)
    desktop: {
      left: '38.5%',
      bottom: '63.5%',
      openWidth: '15%',
      closedWidth: '13%',
      openHeight: '5%',
      closedHeight: '2%',
    },
    // Tampilan Mobile (< 640px)
    mobile: {
      left: '38.5%',
      bottom: '63.5%',
      openWidth: '15.5%',
      closedWidth: '13%',
      openHeight: '5.2%',
      closedHeight: '2.2%',
    },
  },
};

export default function QuestionPanel() {
  const { questions, currentQuestionIndex, submitAnswer, nextQuestion, selectedBackground } = useGameStore();
  const question = questions[currentQuestionIndex];

  const [selected, setSelected]       = useState<number | null>(null);
  const [isCorrect, setIsCorrect]     = useState<boolean | null>(null);
  const [currentHint, setCurrentHint] = useState<string>('');
  const [showOwl, setShowOwl]         = useState(false);
  const [revealed, setRevealed]       = useState(false);
  const [isMobile, setIsMobile]       = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Teacher selection (Bu Guru for Perpustakaan Pagi / sunlit library)
  const isFemaleTeacher = selectedBackground === '/backgrounds/library_sunlit.jpg';
  const teacherImg      = isFemaleTeacher ? '/sprites/teacher_female_idle.png' : '/sprites/teacher_idle.png';
  const teacherAlt      = isFemaleTeacher ? 'Bu Guru' : 'Pak Guru';

  // Typewriting & Natural Talking Mouth State
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTyping, setIsTyping]           = useState<boolean>(true);
  const [mouthOpen, setMouthOpen]         = useState<boolean>(false);
  const typingTimerRef                    = useRef<NodeJS.Timeout | null>(null);

  const fullQuestionText = question?.question || '';

  // Preload teacher sprites once on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const img1 = new window.Image();
      img1.src = '/sprites/teacher_idle.png';
      const img2 = new window.Image();
      img2.src = '/sprites/teacher_talking.png';
      const img3 = new window.Image();
      img3.src = '/sprites/teacher_female_idle.png';
      const img4 = new window.Image();
      img4.src = '/sprites/teacher_female_talking.png';
    }
  }, []);

  // Typewriter effect synced with natural mouth flapping
  useEffect(() => {
    if (!fullQuestionText) return;

    setDisplayedText('');
    setIsTyping(true);
    setMouthOpen(false);

    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
    }

    let charIndex = 0;
    // Comfortable typewriter rate (~70ms per character)
    typingTimerRef.current = setInterval(() => {
      charIndex += 1;
      const currentSlice = fullQuestionText.slice(0, charIndex);
      setDisplayedText(currentSlice);

      const lastChar = fullQuestionText[charIndex - 1];
      const isWhitespaceOrPunct = !lastChar || /[\s.,!?;:—\-]/.test(lastChar);

      if (!isWhitespaceOrPunct) {
        sfxTextBlip();
        // Natural talking cadence: alternate open/closed every ~2 characters (~140ms)
        const frame = Math.floor(charIndex / 2) % 2 === 0;
        setMouthOpen(frame);
      } else {
        // Close mouth on spaces, pauses, and punctuation
        setMouthOpen(false);
      }

      if (charIndex >= fullQuestionText.length) {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        setIsTyping(false);
        setMouthOpen(false);
      }
    }, 70);

    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
      setMouthOpen(false);
    };
  }, [fullQuestionText, currentQuestionIndex]);

  // Click bubble to instantly reveal full question
  const handleFastForward = useCallback(() => {
    if (isTyping) {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      setDisplayedText(fullQuestionText);
      setIsTyping(false);
      setMouthOpen(false);
    }
  }, [isTyping, fullQuestionText]);

  if (!question) return null;

  function handleSelect(index: number) {
    if (revealed) return;
    // Also complete typewriter if user clicks answer early
    if (isTyping) {
      handleFastForward();
    }
    setSelected(index);
    const result = submitAnswer(index);
    setRevealed(true);

    if (result.isCorrect) {
      setIsCorrect(true);
      sfxCorrect();
    } else {
      setIsCorrect(false);
      setCurrentHint(result.hint);
      sfxWrong();
      setTimeout(() => setShowOwl(true), 350);
    }
  }

  function handleNext() {
    setSelected(null);
    setIsCorrect(null);
    setRevealed(false);
    setShowOwl(false);
    setCurrentHint('');
    nextQuestion();
  }

  function handleOwlClose() {
    setShowOwl(false);
  }

  return (
    <>
      <div className="w-full max-w-4xl sm:max-w-5xl lg:max-w-5xl xl:max-w-6xl mx-auto flex flex-col gap-5 sm:gap-8 my-auto">

        {/* Natural Chat Dialogue: Speech Bubble on Left, Pak Guru / Bu Guru on Right */}
        <div className="flex flex-row items-end gap-2 sm:gap-6">

          {/* Speech Bubble Container — Compact & Tighter Line Spacing */}
          <div
            onClick={handleFastForward}
            className="flex-1 comic-bubble-wrapper flex flex-col justify-center cursor-pointer select-none transition-all hover:border-amber-400 min-h-[70px] sm:min-h-[130px] md:min-h-[150px] shadow-2xl p-2 sm:p-3.5"
            title={isTyping ? 'Klik untuk mempercepat teks' : ''}
          >
            {/* Dialogue Text Container */}
            <div className="w-full flex items-center px-1.5 sm:px-4 min-h-[45px] sm:min-h-[90px] md:min-h-[105px]">
              <p className="font-dialogue text-base sm:text-2xl md:text-3xl lg:text-4xl text-white tracking-wide leading-snug sm:leading-normal whitespace-pre-line break-words">
                {displayedText}
                {isTyping && <span className="typewriter-cursor">▋</span>}
              </p>
            </div>
          </div>

          {/* Teacher Sprite — Compact on Mobile (<640px), Full Size on Desktop */}
          <div className="shrink-0 flex items-end justify-center self-end mb-1">
            <div
              className="relative w-16 h-26 sm:w-28 sm:h-44 md:w-34 md:h-52 flex items-end justify-center"
              style={{
                transform: isFemaleTeacher ? 'scale(1.08)' : 'scale(1.02)',
                transformOrigin: 'bottom center',
              }}
            >
              <img
                src={teacherImg}
                alt={teacherAlt}
                className="w-full h-full object-contain object-bottom select-none pointer-events-none"
                style={{
                  imageRendering: 'pixelated',
                  filter: [
                    'drop-shadow(2px 0px 0px rgba(255,255,255,0.9))',
                    'drop-shadow(-2px 0px 0px rgba(255,255,255,0.9))',
                    'drop-shadow(0px 2px 0px rgba(255,255,255,0.9))',
                    'drop-shadow(0px -2px 0px rgba(255,255,255,0.9))',
                    'drop-shadow(0px 10px 20px rgba(0,0,0,0.85))',
                  ].join(' '),
                }}
              />
              {/* Mouth Flap Overlay synced with TEACHER_MOUTH_CONFIG */}
              {(() => {
                const teacherConfig = isFemaleTeacher
                  ? isMobile ? TEACHER_MOUTH_CONFIG.female.mobile : TEACHER_MOUTH_CONFIG.female.desktop
                  : isMobile ? TEACHER_MOUTH_CONFIG.male.mobile : TEACHER_MOUTH_CONFIG.male.desktop;

                return (
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: teacherConfig.left,
                      bottom: teacherConfig.bottom,
                      transform: 'translate(-50%, 50%)',
                      width: mouthOpen ? teacherConfig.openWidth : teacherConfig.closedWidth,
                      height: mouthOpen ? teacherConfig.openHeight : teacherConfig.closedHeight,
                      borderRadius: '50%',
                      backgroundColor: mouthOpen ? 'rgba(25,6,6,0.95)' : 'rgba(50,20,12,0.82)',
                      boxShadow: mouthOpen ? 'inset 0 1px 2px rgba(255,220,210,0.3)' : 'none',
                      transition: 'height 55ms ease, width 55ms ease',
                      pointerEvents: 'none',
                    }}
                  />
                );
              })()}
            </div>
          </div>

        </div>

        {/* Options Grid — 2 Columns on Mobile & Desktop (Matching Sombo Battle Format) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-6 w-full">
          {question.options.map((opt, i) => {
            let stateClass = '';
            if (revealed) {
              if (i === question.correctIndex) stateClass = 'correct';
              else if (i === selected && !isCorrect) stateClass = 'wrong';
              else stateClass = 'disabled opacity-50';
            }

            return (
              <button
                key={i}
                className={`answer-option !text-sm sm:!text-2xl md:!text-3xl !py-2 sm:!py-3.5 !px-3 sm:!px-6 min-h-[45px] sm:min-h-[75px] hover:!border-amber-400 ${stateClass}`}
                onClick={() => handleSelect(i)}
                disabled={revealed}
              >
                <span className="opt-key font-bold font-dialogue text-sm sm:text-2xl md:text-3xl shrink-0 text-amber-300">
                  {OPTION_KEYS[i]})
                </span>
                <span className="flex-1 font-dialogue leading-tight text-left text-xs sm:text-2xl md:text-3xl break-words">
                  {opt}
                </span>
                {revealed && i === question.correctIndex && (
                  <span className="text-emerald-400 font-bold text-sm sm:text-2xl ml-auto shrink-0">✓</span>
                )}
                {revealed && i === selected && !isCorrect && (
                  <span className="text-red-400 font-bold text-sm sm:text-2xl ml-auto shrink-0">✗</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Next Action Bar */}
        {revealed && !showOwl && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-6 bg-black/95 border-3 sm:border-4 border-amber-500 rounded-2xl shadow-2xl">
            <div className="font-dialogue text-xl sm:text-3xl">
              {isCorrect ? (
                <span className="text-emerald-400 font-bold">✨ JAWABAN TEPAT! (+100 Poin)</span>
              ) : (
                <span className="text-red-400">Arsip belum terbuka. Simak petunjuknya!</span>
              )}
            </div>

            <button
              className="btn-pixel btn-pixel-gold !py-3 sm:!py-4 !px-6 sm:!px-10 text-sm sm:text-xl font-bold flex items-center gap-2 ml-auto shadow-xl"
              onClick={handleNext}
            >
              <span>{currentQuestionIndex + 1 < questions.length ? 'SOAL BERIKUTNYA ▶' : 'SELESAIKAN MISI 🏆'}</span>
            </button>
          </div>
        )}

      </div>

      {/* Guardian Owl Hint Modal */}
      {showOwl && (
        <GuardianOwlModal
          hint={currentHint}
          onClose={handleOwlClose}
        />
      )}
    </>
  );
}

