'use client';

/**
 * BackgroundSelectScreen.tsx
 * Pilihan "Tempat Belajar" — 3 lokasi: 2 perpustakaan + Ruang Kelas Unggulan (boss battle).
 * Perpustakaan → quiz_library | Ruang Kelas Unggulan → boss_battle
 */

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import PixelSprite from './PixelSprite';
import { sfxPageTurn, sfxGearEquip, unlockAudioEngine } from '@/lib/audioEngine';

interface PlaceOption {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  url: string;
  tag: string;
  badgeColor: string;
  isBoss?: boolean;
}

const PLACE_OPTIONS: PlaceOption[] = [
  {
    id: 'sunlit',
    title: 'Perpustakaan Taman Pagi',
    subtitle: 'Suasana Asri & Hangat',
    desc: 'Ruang baca asri bermandikan sinar matahari pagi dengan pemandangan tanaman hijau. Pelajari materi kuis bersama Bu Guru yang ramah dan bijak.',
    url: '/backgrounds/library_sunlit.jpg',
    tag: 'BU GURU 🌿',
    badgeColor: 'bg-amber-500 text-stone-950 border-amber-300',
  },
  {
    id: 'midnight',
    title: 'Perpustakaan Klasik',
    subtitle: 'Suasana Megah & Antik',
    desc: 'Ruang perpustakaan megah dengan jajaran rak buku kayu antik. Asah pemahamanmu bersama Pak Guru yang berpengalaman.',
    url: '/backgrounds/library_bg.jpg',
    tag: 'PAK GURU 🏛️',
    badgeColor: 'bg-indigo-950 text-indigo-200 border-indigo-500',
  },
  {
    id: 'classroom',
    title: 'Ruang Kelas Unggulan',
    subtitle: '⚡ Boss Battle — Hitung Cepat',
    desc: 'Tantang sang rival berbakat di Ruang Kelas Unggulan! Buktikan bahwa rajinmu bisa mengalahkan bakatnya dalam duel hitung cepat.',
    url: '/backgrounds/classroom_battle.jpg',
    tag: '⚔️ BOSS BATTLE',
    badgeColor: 'bg-red-900 text-red-200 border-red-400',
    isBoss: true,
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

  function handleSelectPlace(opt: PlaceOption) {
    unlockAudioEngine();
    sfxGearEquip();
    if (!opt.isBoss) {
      setSelectedBackground(opt.url);
    }
  }

  const selectedOpt = PLACE_OPTIONS.find(
    (o) => o.isBoss ? false : selectedBackground === o.url
  );
  const isBossSelected = PLACE_OPTIONS.find((o) => o.isBoss)?.url === undefined
    ? false
    : false; // track boss selection separately

  // Track which option is "active" — boss has its own selection state
  const [activePlaceId, setActivePlaceId] = React.useState<string>(
    selectedBackground === '/backgrounds/library_sunlit.jpg' ? 'sunlit'
    : selectedBackground === '/backgrounds/library_bg.jpg' ? 'midnight'
    : 'sunlit'
  );

  function handleSelect(opt: PlaceOption) {
    unlockAudioEngine();
    sfxGearEquip();
    setActivePlaceId(opt.id);
    if (!opt.isBoss) {
      setSelectedBackground(opt.url);
    }
  }

  function handleStart() {
    unlockAudioEngine();
    sfxPageTurn();
    if (activePlaceId === 'classroom') {
      setScreen('boss_battle');
    } else {
      setScreen('quiz_library');
    }
  }

  function handleBack() {
    sfxPageTurn();
    setScreen('character');
  }

  const activeOpt = PLACE_OPTIONS.find((o) => o.id === activePlaceId) ?? PLACE_OPTIONS[0];

  return (
    <div className="relative min-h-screen bg-[#07040B] flex flex-col items-center justify-center p-3 sm:p-5 md:p-8 overflow-x-hidden select-none">
      
      {/* Dynamic Ambient Background Blur */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-md opacity-30 scale-105 pointer-events-none transition-all duration-700"
        style={{ backgroundImage: `url(${activeOpt.url})` }}
      />
      <div className={`absolute inset-0 pointer-events-none transition-all duration-700 ${
        activePlaceId === 'classroom'
          ? 'bg-red-950/80'
          : 'bg-black/75'
      }`} />
      <div className="crt-scanlines-overlay" />

      {/* Main CRT Frame Container */}
      <div className="relative z-10 w-full max-w-5xl crt-arcade-frame bg-[#140E0A] p-4 sm:p-7 md:p-8 flex flex-col items-center text-center border-4 border-[#7D4E2D] shadow-2xl rounded-2xl my-auto">

        {/* Top Header */}
        <div className="mb-5 sm:mb-7">
          <div className="retro-pill-badge !bg-amber-950 !border-amber-400 text-amber-300 mb-2.5 inline-flex items-center gap-1.5 !text-xs sm:!text-sm">
            <span>🏫</span>
            <span>PILIH TEMPAT BELAJAR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-300 drop-shadow-[0_2px_8px_rgba(255,179,0,0.5)] leading-tight">
            TEMPAT BELAJAR
          </h1>
          <p className="font-dialogue text-lg sm:text-2xl text-stone-200 max-w-xl mx-auto mt-1 leading-snug">
            Tentukan tempat belajarmu — perpustakaan tenang atau tantang lawan di kelas!
          </p>
        </div>

        {/* 3 Cards Grid: 2 col on sm+, stacked on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 w-full mb-6 sm:mb-8 text-left">
          {PLACE_OPTIONS.map((opt) => {
            const isSelected = activePlaceId === opt.id;

            return (
              <div
                key={opt.id}
                onClick={() => handleSelect(opt)}
                className={`rounded-2xl border-4 overflow-hidden transition-all duration-300 cursor-pointer relative flex flex-col group ${
                  isSelected
                    ? opt.isBoss
                      ? 'border-red-500 shadow-[0_0_32px_rgba(220,38,38,0.55)] scale-[1.02] bg-[#1A0808]'
                      : 'border-amber-400 shadow-[0_0_28px_rgba(255,179,0,0.45)] scale-[1.02] bg-[#1F130B]'
                    : opt.isBoss
                    ? 'border-red-900/70 bg-stone-950/70 hover:border-red-500/60 opacity-80 hover:opacity-100'
                    : 'border-stone-700 bg-stone-950/70 hover:border-amber-500/60 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Thumbnail Image Banner */}
                <div className="relative h-40 sm:h-48 w-full bg-stone-950 overflow-hidden">
                  <img
                    src={opt.url}
                    alt={opt.title}
                    className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

                  {/* Boss battle overlay effect */}
                  {opt.isBoss && (
                    <div className="absolute inset-0 bg-red-900/20 pointer-events-none" />
                  )}

                  {/* Top Badges */}
                  <div className={`absolute top-3 right-3 text-xs sm:text-sm font-bold px-2.5 py-1 rounded shadow border ${
                    opt.isBoss
                      ? 'bg-red-900/90 border-red-500/60 text-red-300'
                      : 'bg-black/80 border-amber-500/50 text-amber-300'
                  }`}>
                    {opt.tag}
                  </div>

                  {isSelected && (
                    <div className={`absolute top-3 left-3 text-xs sm:text-sm font-black px-2.5 py-1 rounded shadow flex items-center gap-1 animate-pulse ${
                      opt.isBoss
                        ? 'bg-red-500 text-white'
                        : 'bg-amber-400 text-stone-950'
                    }`}>
                      <span>✓</span>
                      <span>DIPILIH</span>
                    </div>
                  )}

                  {/* Image Overlay Title */}
                  <div className="absolute bottom-2.5 left-3 right-3">
                    <h3 className={`text-lg sm:text-xl md:text-2xl font-bold leading-tight ${
                      opt.isBoss ? 'text-red-200' : 'text-amber-200'
                    }`}>
                      {opt.title}
                    </h3>
                    <span className={`text-xs sm:text-sm font-bold tracking-wide ${
                      opt.isBoss ? 'text-red-300' : 'text-amber-300'
                    }`}>
                      {opt.subtitle}
                    </span>
                  </div>
                </div>

                {/* Description Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <p className="font-dialogue text-base sm:text-lg md:text-xl text-stone-100 leading-snug tracking-wide">
                    {opt.desc}
                  </p>
                  {opt.isBoss && (
                    <div className="mt-3 text-xs sm:text-sm text-red-300 font-dialogue border border-red-900/80 rounded-lg px-2.5 py-1.5 bg-red-950/70 font-bold">
                      ⚡ Mode Khusus — Soal otomatis • Dynamic Math Battle • Unlimited Math
                    </div>
                  )}
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
            onClick={handleStart}
            className={`w-full sm:w-auto px-7 py-3 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer btn-pixel ${
              activePlaceId === 'classroom'
                ? '!bg-red-800 hover:!bg-red-700 !border-red-500 text-white'
                : 'btn-pixel-gold'
            }`}
          >
            {activePlaceId === 'classroom' ? (
              <>
                <span>⚔️</span>
                <span>TANTANG BOSS</span>
                <span>▶</span>
              </>
            ) : (
              <>
                <span>📖</span>
                <span>MASUKI TEMPAT BELAJAR</span>
                <span>▶</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
