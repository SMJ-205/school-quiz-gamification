'use client';

/**
 * PixelSprite.tsx
 * Ultra-crisp character sprite renderer for "The Growth of Knowledge"
 * Pure base character sprites:
 * - Murid Laki-laki: Official Merah Putih uniform, SD cap, sneakers (shadow removed).
 * - Murid Perempuan: Official Merah Putih uniform, pristine white hijab, red pleated skirt.
 * - Jumping celebration versions for Certificate.
 */

import React from 'react';
import { CharacterGear } from '@/store/useGameStore';

interface PixelSpriteProps {
  character: CharacterGear;
  pixelSize?: number;
  animate?: boolean;
  jumping?: boolean;
  style?: React.CSSProperties;
}

export default function PixelSprite({
  character,
  pixelSize = 0.55,
  animate = false,
  jumping = false,
  style,
}: PixelSpriteProps) {
  const width = Math.round(240 * pixelSize);
  const height = Math.round(360 * pixelSize);

  // Select Sprite Source
  let src = '/sprites/boy_base.png';
  if (jumping) {
    src = character.gender === 'girl' ? '/sprites/girl_jumping.png' : '/sprites/boy_jumping.png';
  } else {
    src = character.gender === 'girl' ? '/sprites/girl_base.png' : '/sprites/boy_base.png';
  }

  const isGirl = character.gender === 'girl';

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        imageRendering: 'pixelated',
        ...(animate ? { animation: 'float 2.5s ease-in-out infinite' } : {}),
        ...style,
      }}
    >
      <img
        src={src}
        alt={isGirl ? 'Murid Perempuan' : 'Murid Laki-laki'}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          imageRendering: 'pixelated',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
