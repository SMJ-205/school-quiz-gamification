'use client';

import React, { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import IngestionScreen from '@/components/IngestionScreen';
import CharacterCustomizer from '@/components/CharacterCustomizer';
import BackgroundSelectScreen from '@/components/BackgroundSelectScreen';
import EnchantedLibrary from '@/components/quiz/EnchantedLibrary';
import BossBattleArena from '@/components/quiz/BossBattleArena';
import AntigravityCanvas from '@/components/AntigravityCanvas';
import CertificateCanvas from '@/components/CertificateCanvas';
import { startQuizBGM, stopQuizBGM } from '@/lib/audioEngine';

export default function Home() {
  const currentScreen = useGameStore((s) => s.currentScreen);

  // Single global BGM controller for screen switching (prevents track overlap)
  useEffect(() => {
    if (currentScreen === 'quiz_library') {
      startQuizBGM('momo_island');
    } else if (currentScreen === 'boss_battle') {
      startQuizBGM('fast_boss_beat');
    } else {
      stopQuizBGM();
    }
  }, [currentScreen]);

  switch (currentScreen) {
    case 'ingestion':          return <IngestionScreen />;
    case 'character':          return <CharacterCustomizer />;
    case 'background_select':  return <BackgroundSelectScreen />;
    case 'quiz_library':       return <EnchantedLibrary />;
    case 'boss_battle':        return <BossBattleArena />;
    case 'antigravity':        return <AntigravityCanvas />;
    case 'certificate':        return <CertificateCanvas />;
    default:                   return <IngestionScreen />;
  }
}
