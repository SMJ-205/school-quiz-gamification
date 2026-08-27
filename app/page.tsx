'use client';

import { useGameStore } from '@/store/useGameStore';
import IngestionScreen from '@/components/IngestionScreen';
import CharacterCustomizer from '@/components/CharacterCustomizer';
import EnchantedLibrary from '@/components/quiz/EnchantedLibrary';
import AntigravityCanvas from '@/components/AntigravityCanvas';
import CertificateCanvas from '@/components/CertificateCanvas';

export default function Home() {
  const currentScreen = useGameStore((s) => s.currentScreen);

  switch (currentScreen) {
    case 'ingestion':    return <IngestionScreen />;
    case 'character':    return <CharacterCustomizer />;
    case 'quiz_library': return <EnchantedLibrary />;
    case 'antigravity':  return <AntigravityCanvas />;
    case 'certificate':  return <CertificateCanvas />;
    default:             return <IngestionScreen />;
  }
}
