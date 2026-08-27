'use client';

import React, { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import IngestionScreen from '@/components/IngestionScreen';
import CharacterCustomizer from '@/components/CharacterCustomizer';
import EnchantedLibrary from '@/components/quiz/EnchantedLibrary';
import AntigravityCanvas from '@/components/AntigravityCanvas';
import CertificateCanvas from '@/components/CertificateCanvas';
import { startQuizBGM, stopQuizBGM } from '@/lib/audioEngine';

export default function Home() {
  const currentScreen = useGameStore((s) => s.currentScreen);

  // BGM is strictly dedicated to Quiz Library session only
  useEffect(() => {
    if (currentScreen === 'quiz_library') {
      startQuizBGM();
    } else {
      stopQuizBGM();
    }
  }, [currentScreen]);

  switch (currentScreen) {
    case 'ingestion':    return <IngestionScreen />;
    case 'character':    return <CharacterCustomizer />;
    case 'quiz_library': return <EnchantedLibrary />;
    case 'antigravity':  return <AntigravityCanvas />;
    case 'certificate':  return <CertificateCanvas />;
    default:             return <IngestionScreen />;
  }
}
