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
  const { questions, currentQuestionIndex, submitAnswer, nextQuestion } = useGameStore();
  const question = questions[currentQuestionIndex];

  const [selected, setSelected]       = useState<number | null>(null);
  const [isCorrect, setIsCorrect]     = useState<boolean | null>(null);
  const [currentHint, setCurrentHint] = useState<string>('');
  const [showOwl, setShowOwl]         = useState(false);
  const [revealed, setRevealed]       = useState(false);

  // Typewriting state
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTyping, setIsTyping]           = useState<boolean>(true);
  const typingTimerRef                    = useRef<NodeJS.Timeout | null>(null);

  const fullQuestionText = question?.question || '';

  // Typewriter effect
  useEffect(() => {
    if (!fullQuestionText) return;

    setDisplayedText('');
    setIsTyping(true);

    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
    }

    let charIndex = 0;
    // Slower, comfortable typewriting rate (~70ms per character)
    typingTimerRef.current = setInterval(() => {
      charIndex += 1;
      const currentSlice = fullQuestionText.slice(0, charIndex);
      setDisplayedText(currentSlice);

      const lastChar = fullQuestionText[charIndex - 1];
      // Play light retro blip for non-space characters
      if (lastChar && lastChar.trim() !== '') {
        sfxTextBlip();
      }

      if (charIndex >= fullQuestionText.length) {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        setIsTyping(false);
      }
    }, 70);

    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
    };
  }, [fullQuestionText, currentQuestionIndex]);

  // Click bubble to instantly reveal full question
  const handleFastForward = useCallback(() => {
    if (isTyping) {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      setDisplayedText(fullQuestionText);
      setIsTyping(false);
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
      <div className="w-full flex flex-col gap-3.5 sm:gap-5">

        {/* Natural Chat Dialogue: Speech Bubble on Left, Pak Guru on Right */}
        <div className="flex flex-row items-center sm:items-end gap-3 sm:gap-5">

          {/* Speech Bubble Container with generous padding and seamless beak */}
          <div
            onClick={handleFastForward}
            className="flex-1 comic-bubble-wrapper p-5 sm:p-7 md:px-9 md:py-7 flex flex-col justify-center cursor-pointer select-none transition-all hover:border-amber-400 min-h-[96px] sm:min-h-[120px]"
            title={isTyping ? 'Klik untuk mempercepat teks' : ''}
          >
            {/* Natural Dialogue Text without quotes and with ample spacing */}
            <div className="w-full flex items-center px-3 sm:px-5 py-2">
              <p className="font-dialogue text-xl sm:text-2xl md:text-3xl text-white tracking-wide leading-relaxed pl-2 sm:pl-3">
                {displayedText}
                {isTyping && <span className="typewriter-cursor">▋</span>}
              </p>
            </div>
          </div>

          {/* Teacher Sprite standing cleanly on the right (No box, no title badge) */}
          <div className="shrink-0 flex items-end justify-center">
            <div className={`relative w-20 h-28 sm:w-28 sm:h-40 flex items-end justify-center transition-transform ${isTyping ? 'anim-teacher-talking' : 'anim-teacher-idle'}`}>
              <Image
                src="/sprites/teacher.png"
                alt="Pak Guru"
                fill
                sizes="(max-width: 640px) 80px, 112px"
                className="object-contain select-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
                style={{ imageRendering: 'pixelated' }}
                priority
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
                className={`answer-option !text-lg sm:!text-2xl !py-2.5 !px-3.5 sm:!py-3 sm:!px-4 ${stateClass}`}
                onClick={() => handleSelect(i)}
                disabled={revealed}
              >
                <span className="opt-key font-bold font-dialogue text-xl sm:text-2xl">
                  {OPTION_KEYS[i]})
                </span>
                <span className="flex-1 font-dialogue leading-tight text-left text-lg sm:text-2xl">
                  {opt}
                </span>
                {revealed && i === question.correctIndex && (
                  <span className="text-emerald-400 font-bold text-lg sm:text-xl ml-auto">✓</span>
                )}
                {revealed && i === selected && !isCorrect && (
                  <span className="text-red-400 font-bold text-lg sm:text-xl ml-auto">✗</span>
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

