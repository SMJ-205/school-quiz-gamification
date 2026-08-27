'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import PixelProgressBar from '../PixelProgressBar';
import QuestionPanel from './QuestionPanel';
import PixelSprite from '../PixelSprite';
import { sfxBridgeExtend } from '@/lib/audioEngine';

const TOTAL_TILES = 5;

export default function CrystalBridge() {
  const { currentQuestionIndex, correctAnswersCount, character, questions } = useGameStore();
  const [litTiles, setLitTiles] = useState<number[]>([]);
  const [spritePos, setSpritePos] = useState(0);
  const [prevCorrect, setPrevCorrect] = useState(correctAnswersCount);

  useEffect(() => {
    if (correctAnswersCount > prevCorrect) {
      const tileIndex = currentQuestionIndex % TOTAL_TILES;
      setLitTiles((prev) => [...prev, tileIndex]);
      sfxBridgeExtend();
      setSpritePos(tileIndex);
    }
    setPrevCorrect(correctAnswersCount);
  }, [correctAnswersCount]);

  const tiles = Array.from({ length: TOTAL_TILES }, (_, i) => i);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0604]">
      {/* Top Global Progress Bar */}
      <PixelProgressBar />

      {/* Main Game Screen Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 md:p-6">
        <div className="w-full max-w-5xl crt-arcade-frame bg-[#100D1A] flex flex-col relative overflow-hidden shadow-2xl">

          {/* CRT Top Bar */}
          <div className="p-4 flex items-center justify-between border-b-2 border-stone-800 bg-black/40 z-20">
            <div className="flex items-center gap-3">
              <div className="retro-pill-badge !bg-cyan-950/80 !border-cyan-500/60 text-cyan-300">
                💎 ANCIENT CRYSTAL PATH
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="retro-pill-badge !bg-amber-950/80 !border-amber-500/60 text-amber-300">
                QUIZ MODE
              </div>
            </div>
          </div>

          {/* Arena Stage */}
          <div className="relative w-full min-h-[440px] md:min-h-[480px] bg-gradient-to-b from-[#0B091A] via-[#1A1433] to-[#0A0714] flex flex-col justify-between p-4 md:p-6 overflow-hidden">

            {/* Starry Night Observatory Sky */}
            <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-amber-200 rounded-full animate-pulse"
                  style={{
                    left: `${(i * 19.3) % 100}%`,
                    top: `${(i * 17.7) % 70}%`,
                    animationDelay: `${(i * 0.3) % 3}s`,
                  }}
                />
              ))}
            </div>

            {/* Ancient Tower Pillars & Telescope */}
            <div className="absolute inset-x-8 top-12 flex justify-between pointer-events-none opacity-30 z-0 text-3xl">
              <span>🏛️</span>
              <span>🔭</span>
              <span>🏛️</span>
            </div>

            {/* Question & Options */}
            <div className="relative z-20 w-full max-w-3xl mx-auto mb-4">
              <QuestionPanel />
            </div>

            {/* Crystal Pedestals & Pathway Stage */}
            <div className="relative z-10 w-full mt-auto">
              <div className="flex items-end justify-center gap-3 mb-3">
                {/* Start Altar */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-10 bg-[#422B18] border-2 border-[#7D4E2D] rounded-t flex items-center justify-center font-dialogue text-base text-amber-300">
                    AWAL
                  </div>
                </div>

                {/* 5 Crystal Steps */}
                {tiles.map((i) => {
                  const isLit = litTiles.includes(i);
                  const isCurrent = currentQuestionIndex % TOTAL_TILES === i;
                  const hasCharacter = spritePos === i && isLit;

                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      {/* Character Sprite standing on crystal step */}
                      {hasCharacter && (
                        <div className="animate-bounce">
                          <PixelSprite character={character} pixelSize={0.25} />
                        </div>
                      )}

                      {/* Crystal Pedestal */}
                      <div
                        className={`w-14 h-12 rounded-t flex items-center justify-center text-2xl transition-all duration-300 ${
                          isLit
                            ? 'bg-gradient-to-t from-cyan-900 to-cyan-500/80 border-2 border-cyan-300 shadow-[0_0_20px_rgba(0,229,255,0.7)] text-cyan-200'
                            : isCurrent
                              ? 'bg-stone-800/80 border-2 border-amber-400 text-stone-500 animate-pulse'
                              : 'bg-stone-900/80 border-2 border-stone-700 text-stone-600'
                        }`}
                      >
                        {isLit ? '💎' : '🪨'}
                      </div>
                    </div>
                  );
                })}

                {/* Final Goal: Starlight Academy Portal */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-12 bg-amber-950/80 border-2 border-amber-400/70 rounded-t flex items-center justify-center text-2xl">
                    🏛️
                  </div>
                </div>
              </div>

              {/* Stone Bridge Foundation */}
              <div className="w-full h-6 bg-[#1F1529] border-t-2 border-purple-900/50 shadow-inner" />
            </div>

          </div>

          {/* CRT Bottom Bar */}
          <div className="p-3 flex items-center justify-between border-t-2 border-stone-800 bg-black/60 z-20 font-dialogue text-xl tracking-wider text-stone-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>OBSERVATORY PATH</span>
            </div>

            <div className="flex items-center gap-2 text-cyan-300">
              <span>CRYSTALS ILLUMINATED:</span>
              <span className="text-white font-bold">{correctAnswersCount}/{questions.length}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
