'use client';

/**
 * BackgroundSelectScreen.tsx
 * Aesthetic Retro RPG Library Atmosphere Customization Screen:
 * - Select Library Background (Ghibli Sunlit Botanical vs Enchanted Midnight Archive).
 * - Retro CRT Arcade aesthetic with student character avatar.
 * - 100% Mobile Responsive.
 */

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import PixelSprite from './PixelSprite';
import { sfxPageTurn, sfxGearEquip, unlockAudioEngine } from '@/lib/audioEngine';

interface BackgroundOption {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  url: string;
  tag: string;
  badgeColor: string;
}

const BG_OPTIONS: BackgroundOption[] = [
  {
    id: 'sunlit',
    title: 'Perpustakaan Taman Pagi',
    subtitle: 'Suasana Asri & Hangat',
    desc: 'Ruang baca asri bermandikan sinar matahari pagi dengan pemandangan tanaman hijau dan jendela taman terbuka.',
    url: '/backgrounds/library_sunlit.jpg',
    tag: 'TAMAN PAGI 🌿',
    badgeColor: 'bg-amber-500 text-stone-950 border-amber-300',
  },
  {
    id: 'midnight',
    title: 'Perpustakaan Klasik',
    subtitle: 'Suasana Megah & Antik',
    desc: 'Ruang perpustakaan megah dengan jajaran rak buku kayu antik yang tinggi dan pilar kastil klasik bercahaya lentera.',
    url: '/backgrounds/library_bg.jpg',
    tag: 'KLASIK 🏛️',
    badgeColor: 'bg-indigo-950 text-indigo-200 border-indigo-500',
  },
];

export default function BackgroundSelectScreen() {
  const {
    studentName,
    character,
    selectedBackground,
    setSelectedBackground,
    setScreen,
  } = useGameStore();

  function handleSelectBackground(url: string) {
    unlockAudioEngine();
    sfxGearEquip();
    setSelectedBackground(url);
  }

  function handleStartQuiz() {
    unlockAudioEngine();
    sfxPageTurn();
    setScreen('quiz_library');
  }

  function handleBack() {
    sfxPageTurn();
    setScreen('character');
  }

  return (
    <div className="relative min-h-screen bg-[#07040B] flex flex-col items-center justify-center p-3 sm:p-5 md:p-8 overflow-x-hidden select-none">
      
      {/* Dynamic Ambient Background Blur */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-md opacity-30 scale-105 pointer-events-none transition-all duration-700"
        style={{ backgroundImage: `url(${selectedBackground || '/backgrounds/library_sunlit.jpg'})` }}
      />
      <div className="absolute inset-0 bg-black/75 pointer-events-none" />

      {/* Main CRT Frame Container */}
      <div className="relative z-10 w-full max-w-3xl crt-arcade-frame bg-[#140E0A] p-4 sm:p-7 md:p-8 flex flex-col items-center text-center border-4 border-[#7D4E2D] shadow-2xl rounded-2xl my-auto">

        {/* Top Header */}
        <div className="mb-5 sm:mb-7">
          <div className="retro-pill-badge !bg-amber-950 !border-amber-400 text-amber-300 mb-2.5 inline-flex items-center gap-1.5">
            <span>🏛️</span>
            <span>SUASANA BELAJAR</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-300 drop-shadow-[0_2px_8px_rgba(255,179,0,0.5)] leading-tight">
            PILIH RUANG PERPUSTAKAAN
          </h1>
          <p className="font-dialogue text-base sm:text-xl text-stone-300 max-w-lg mx-auto mt-1">
            Tentukan latar tempat petualangan kuis ilmu akan berlangsung
          </p>
        </div>

        {/* 2 Large Background Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full mb-6 sm:mb-8 text-left">
          {BG_OPTIONS.map((bg) => {
            const isSelected = selectedBackground === bg.url;

            return (
              <div
                key={bg.id}
                onClick={() => handleSelectBackground(bg.url)}
                className={`rounded-2xl border-4 overflow-hidden transition-all duration-300 cursor-pointer relative flex flex-col group ${
                  isSelected
                    ? 'border-amber-400 shadow-[0_0_28px_rgba(255,179,0,0.45)] scale-[1.02] bg-[#1F130B]'
                    : 'border-stone-700 bg-stone-950/70 hover:border-amber-500/60 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Thumbnail Image Banner */}
                <div className="relative h-40 sm:h-48 w-full bg-stone-950 overflow-hidden">
                  <img
                    src={bg.url}
                    alt={bg.title}
                    className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 right-3 bg-black/80 border border-amber-500/50 text-amber-300 text-xs font-bold px-2.5 py-1 rounded shadow">
                    {bg.tag}
                  </div>

                  {isSelected && (
                    <div className="absolute top-3 left-3 bg-amber-400 text-stone-950 text-xs font-black px-2.5 py-1 rounded shadow flex items-center gap-1 animate-pulse">
                      <span>✓</span>
                      <span>DIPILIH</span>
                    </div>
                  )}

                  {/* Image Overlay Title */}
                  <div className="absolute bottom-2.5 left-3 right-3">
                    <h3 className="text-base sm:text-lg font-bold text-amber-200 leading-tight">
                      {bg.title}
                    </h3>
                    <span className="text-xs text-amber-400 font-medium">
                      {bg.subtitle}
                    </span>
                  </div>
                </div>

                {/* Description Body */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                  <p className="font-dialogue text-sm sm:text-base text-stone-300 leading-relaxed">
                    {bg.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button Navigation */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t-2 border-amber-950/80">
          <button
            onClick={handleBack}
            className="btn-pixel !bg-stone-800 hover:!bg-stone-700 !border-stone-600 text-stone-300 w-full sm:w-auto px-5 py-3 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>◀</span>
            <span>GANTI KARAKTER</span>
          </button>

          <div className="flex items-center gap-2 text-stone-300 font-dialogue text-base sm:text-lg">
            <PixelSprite character={character} pixelSize={0.24} />
            <span className="text-amber-300 font-bold">{studentName || 'Petualang'}</span> siap menjelajah!
          </div>

          <button
            onClick={handleStartQuiz}
            className="btn-pixel btn-pixel-gold w-full sm:w-auto px-7 py-3 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer"
          >
            <span>⚔️</span>
            <span>MASUKI PERPUSTAKAAN</span>
            <span>▶</span>
          </button>
        </div>

      </div>

    </div>
  );
}
