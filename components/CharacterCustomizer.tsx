'use client';

/**
 * CharacterCustomizer.tsx
 * Clean character selection screen (Murid Laki-laki / Murid Perempuan)
 * Focused adventurer selection.
 */

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { GENDER_OPTIONS } from '@/lib/constants';
import PixelSprite from './PixelSprite';
import { sfxGearEquip, sfxPageTurn, isAudioMuted, toggleAudioMute, startQuizBGM, unlockAudioEngine } from '@/lib/audioEngine';

export default function CharacterCustomizer() {
  const { character, setCharacterGender, setScreen, metadata, studentName, setStudentName } = useGameStore();
  const [animTrigger, setAnimTrigger] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isAudioMuted());
  }, []);

  function handleToggleSound() {
    unlockAudioEngine();
    const isNowMuted = toggleAudioMute();
    setMuted(isNowMuted);
  }

  function handleSelectGender(gender: 'boy' | 'girl') {
    unlockAudioEngine();
    setCharacterGender(gender);
    sfxGearEquip();
    setAnimTrigger((prev) => prev + 1);
  }

  function handleStart() {
    unlockAudioEngine();
    sfxPageTurn();
    setScreen('background_select');
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 select-none relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, #2D1A0E 0%, #170E08 60%, #0A0604 100%)',
      }}
    >
      {/* CRT Scanlines Overlay */}
      <div className="crt-scanlines-overlay" />
      {/* Floating Sound Toggle */}
      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={handleToggleSound}
          title={muted ? 'Nyalakan Musik (Unmute)' : 'Matikan Musik (Mute)'}
          className={`p-2 px-3 rounded-lg border text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg ${
            muted
              ? 'bg-red-950/80 border-red-500/60 text-red-300 hover:bg-red-900'
              : 'bg-amber-950/80 border-amber-500/60 text-amber-300 hover:bg-amber-900'
          }`}
        >
          <span>{muted ? '🔇' : '🔊'}</span>
          <span className="text-xs font-dialogue text-base">{muted ? 'MUTE' : 'BGM'}</span>
        </button>
      </div>

      <div className="w-full max-w-3xl relative z-10">

        {/* Top Header Card */}
        <div className="crt-arcade-frame p-3 sm:p-4 mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="retro-pill-badge !text-xs !py-1 !px-2.5">PILIH KARAKTER</div>
            <span className="text-amber-300 font-bold text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">
              {metadata?.title ? `📖 ${metadata.title}` : 'The Growth of Knowledge'}
            </span>
          </div>

          <div className="font-dialogue text-base sm:text-xl text-amber-200/80">
            AKADEMI ILMU
          </div>
        </div>

        {/* Main Selection Area */}
        <div className="pixel-dialogue-box p-4 sm:p-6 flex flex-col items-center gap-4 sm:gap-6">
          
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-amber-300 tracking-wider mb-1">
              SIAPKAN PETUALANGMU
            </h2>
            <p className="font-dialogue text-lg sm:text-xl text-stone-300">
              Pilih karakter murid yang akan menempuh ujian ilmu di Tempat Belajar
            </p>
          </div>

          {/* 2 Character Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-xl">
            {GENDER_OPTIONS.map((opt) => {
              const isSelected = character.gender === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelectGender(opt.value)}
                  className={`p-4 sm:p-5 rounded-xl border-4 transition-all duration-200 flex flex-col items-center text-center cursor-pointer relative group ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-500/25 via-amber-950/40 to-stone-950 border-amber-400 shadow-[0_0_24px_rgba(255,179,0,0.35)] scale-102'
                      : 'bg-stone-900/80 border-stone-700 hover:border-amber-500/60 hover:bg-stone-900 text-stone-300'
                  }`}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 bg-amber-400 text-stone-950 text-xs font-bold px-2 py-0.5 rounded shadow">
                      DIPILIH ✓
                    </div>
                  )}

                  {/* Character Stage Pedestal */}
                  <div className="relative w-32 h-40 sm:w-36 sm:h-44 bg-stone-950/80 border-2 border-amber-500/30 rounded-lg flex items-center justify-center mb-2.5 overflow-hidden shadow-inner">
                    {/* Sparkle */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 text-xs anim-sparkle">✨</div>
                    )}

                    <div className={isSelected ? 'transition-transform transform scale-105' : 'opacity-80'}>
                      <PixelSprite
                        character={{ gender: opt.value }}
                        pixelSize={0.42}
                        animate={isSelected}
                      />
                    </div>

                    {/* Pedestal floor */}
                    <div className="absolute bottom-0 inset-x-0 h-3 bg-amber-950 border-t border-amber-700/40" />
                  </div>

                  {/* Card Title & Desc */}
                  <div className="flex items-center justify-center mb-0.5">
                    <h3 className="text-sm sm:text-base font-bold text-amber-200 tracking-wide">
                      {opt.title}
                    </h3>
                  </div>

                  <p className="text-xs text-amber-400 font-medium mb-1">
                    {opt.label}
                  </p>

                  <p className="font-dialogue text-sm sm:text-base text-stone-400 leading-snug">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Student Name Confirmation Input */}
          <div className="w-full max-w-md flex flex-col gap-1">
            <label className="text-xs font-bold text-amber-300/80 uppercase tracking-widest text-center">
              NAMA PETUALANG / SISWA:
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Masukkan nama petualang..."
              className="w-full bg-black/60 border-2 border-stone-600 focus:border-amber-400 text-amber-200 text-center font-bold px-3 py-2 rounded text-base sm:text-lg outline-none transition-colors"
            />
          </div>

          {/* Big Next Button */}
          <button
            onClick={handleStart}
            className="btn-pixel !bg-stone-800 hover:!bg-stone-700 !border-stone-600 !text-amber-200 hover:!text-white text-sm sm:text-base py-3.5 px-6 sm:px-8 w-full max-w-md flex items-center justify-center gap-2 sm:gap-3 tracking-wider shadow-lg cursor-pointer font-bold"
          >
            <span>LANJUT: PILIH TEMPAT BELAJAR</span>
            <span>▶</span>
          </button>

        </div>

      </div>
    </div>
  );
}
