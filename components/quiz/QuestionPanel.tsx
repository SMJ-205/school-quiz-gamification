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

export default function QuestionPanel() {
  const { questions, currentQuestionIndex, submitAnswer, nextQuestion, selectedBackground } = useGameStore();
  const question = questions[currentQuestionIndex];

  const [selected, setSelected]       = useState<number | null>(null);
  const [isCorrect, setIsCorrect]     = useState<boolean | null>(null);
  const [currentHint, setCurrentHint] = useState<string>('');
  const [showOwl, setShowOwl]         = useState(false);
  const [revealed, setRevealed]       = useState(false);

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
      <div className="w-full flex flex-col gap-3.5 sm:gap-4 mt-2 sm:mt-3">

        {/* Natural Chat Dialogue: Speech Bubble on Left, Pak Guru on Right */}
        <div className="flex flex-row items-end gap-3 sm:gap-4">

          {/* Speech Bubble Container: Sized for 2 lines from the start (no height jump) */}
          {/* Speech Bubble Container */}
          <div
            onClick={handleFastForward}
            className="flex-1 comic-bubble-wrapper flex flex-col justify-center cursor-pointer select-none transition-all hover:border-amber-400 min-h-[90px] sm:min-h-[128px] md:min-h-[138px]"
            title={isTyping ? 'Klik untuk mempercepat teks' : ''}
          >
            {/* Reserved text area with multi-line support for number series */}
            <div className="w-full flex items-start px-1 sm:px-2 min-h-[48px] sm:min-h-[64px] md:min-h-[72px]">
              <p className="font-dialogue text-lg sm:text-2xl md:text-3xl text-white tracking-wide leading-snug sm:leading-relaxed pl-1 sm:pl-2 whitespace-pre-line break-words">
                {displayedText}
                {isTyping && <span className="typewriter-cursor">▋</span>}
              </p>
            </div>
          </div>

          {/* Teacher Sprite — height matched to comic box so head never exceeds bubble top */}
          <div className="shrink-0 flex items-end justify-center self-end mb-0.5">
            <div
              className="relative w-16 h-24 sm:w-19 sm:h-28 md:w-21 md:h-30 flex items-end justify-center"
              style={{
                transform: isFemaleTeacher ? 'scale(1.1)' : 'none',
                transformOrigin: 'bottom center',
              }}
            >
              {/* Always show idle PNG — mouth animation is handled by CSS overlay */}
              <img
                src={teacherImg}
                alt={teacherAlt}
                className="w-full h-full object-contain object-bottom select-none pointer-events-none"
                style={{
                  imageRendering: 'pixelated',
                  filter: [
                    'drop-shadow(1px 0px 0px rgba(255,255,255,0.75))',
                    'drop-shadow(-1px 0px 0px rgba(255,255,255,0.75))',
                    'drop-shadow(0px 1px 0px rgba(255,255,255,0.75))',
                    'drop-shadow(0px -1px 0px rgba(255,255,255,0.75))',
                    'drop-shadow(0px 8px 16px rgba(0,0,0,0.8))',
                  ].join(' '),
                }}
              />
              {/*
                CSS Mouth Overlay:
                - Pak Guru (teacher_idle.png): left 38.5%, bottom 63.5%
                - Bu Guru (teacher_female_idle.png): left 49.9%, bottom 60.9%
              */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: isFemaleTeacher ? '49.9%' : '38.5%',
                  bottom: isFemaleTeacher ? '60.9%' : '63.5%',
                  transform: 'translate(-50%, 50%)',
                  width: mouthOpen ? (isFemaleTeacher ? '14%' : '15%') : (isFemaleTeacher ? '11%' : '13%'),
                  height: mouthOpen ? (isFemaleTeacher ? '4.5%' : '5%') : (isFemaleTeacher ? '1.8%' : '2%'),
                  borderRadius: '50%',
                  backgroundColor: mouthOpen ? 'rgba(25,6,6,0.95)' : 'rgba(50,20,12,0.82)',
                  boxShadow: mouthOpen ? 'inset 0 1px 2px rgba(255,220,210,0.3)' : 'none',
                  transition: 'height 55ms ease, width 55ms ease',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

        </div>

        {/* Options Grid (1 col on mobile, 2 col on tablet/desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
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
                className={`answer-option !text-base sm:!text-2xl !py-2.5 sm:!py-3 !px-3 sm:!px-4 ${stateClass}`}
                onClick={() => handleSelect(i)}
                disabled={revealed}
              >
                <span className="opt-key font-bold font-dialogue text-lg sm:text-2xl shrink-0">
                  {OPTION_KEYS[i]})
                </span>
                <span className="flex-1 font-dialogue leading-tight text-left text-base sm:text-2xl break-words">
                  {opt}
                </span>
                {revealed && i === question.correctIndex && (
                  <span className="text-emerald-400 font-bold text-base sm:text-xl ml-auto shrink-0">✓</span>
                )}
                {revealed && i === selected && !isCorrect && (
                  <span className="text-red-400 font-bold text-base sm:text-xl ml-auto shrink-0">✗</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Next Action Bar */}
        {revealed && !showOwl && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 sm:p-3 bg-black/85 border-2 border-stone-600 rounded-lg shadow-lg">
            <div className="font-dialogue text-lg sm:text-2xl">
              {isCorrect ? (
                <span className="text-emerald-400 font-bold">✨ JAWABAN TEPAT! (+100 Poin)</span>
              ) : (
                <span className="text-red-400">Arsip belum terbuka. Simak petunjuknya!</span>
              )}
            </div>

            <button
              className="btn-pixel btn-pixel-gold !py-2 !px-4 sm:!px-6 text-xs sm:text-sm flex items-center gap-2 ml-auto"
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

