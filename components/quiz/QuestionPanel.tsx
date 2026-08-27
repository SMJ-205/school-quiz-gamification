'use client';

/**
 * QuestionPanel.tsx
 * Ultra-stable, jitter-free question & answer options panel.
 * Zero layout shifts on answering. Fully mobile-responsive.
 */

import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { sfxCorrect, sfxWrong } from '@/lib/audioEngine';
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

  if (!question) return null;

  function handleSelect(index: number) {
    if (revealed) return;
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
      <div className="w-full flex flex-col gap-3 sm:gap-4">

        {/* Question Dialogue Box */}
        <div className="pixel-dialogue-box !bg-[#0C0C12] !border-2 sm:!border-4 !border-stone-300 shadow-2xl p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <span className="text-amber-400 font-bold font-dialogue text-xl sm:text-2xl tracking-wider uppercase whitespace-nowrap">
              SOAL:
            </span>
            <p className="font-dialogue text-xl sm:text-2xl md:text-3xl text-white tracking-wide leading-snug">
              {question.question}
            </p>
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
