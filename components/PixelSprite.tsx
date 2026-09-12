'use client';

/**
 * PixelSprite.tsx
 * Ultra-crisp character sprite renderer for "The Growth of Knowledge"
 * Pure base character sprites:
 * - Murid Laki-laki: Official Merah Putih uniform, SD cap, sneakers (shadow removed).
 * - Murid Perempuan: Official Merah Putih uniform, pristine white hijab, red pleated skirt.
 * - Jumping celebration versions for Certificate.
 */

import React, { useState, useEffect, useRef } from 'react';
import { CharacterGear } from '@/store/useGameStore';

interface PixelSpriteProps {
  character: CharacterGear;
  pixelSize?: number;
  animate?: boolean;
  jumping?: boolean;
  disableBlink?: boolean;
  style?: React.CSSProperties;
}

export default function PixelSprite({
  character,
  pixelSize = 0.55,
  animate = false,
  jumping = false,
  disableBlink = false,
  style,
}: PixelSpriteProps) {
  const width = Math.round(240 * pixelSize);
  const height = Math.round(360 * pixelSize);

  const isGirl = character.gender === 'girl';

  // Base Sprite and Blink Sprite Sources
  const baseSrc = jumping
    ? isGirl ? '/sprites/girl_jumping.png' : '/sprites/boy_jumping.png'
    : isGirl ? '/sprites/girl_base.png' : '/sprites/boy_base.png';

  const blinkSrc = jumping
    ? isGirl ? '/sprites/girl_jumping_blink.png' : '/sprites/boy_jumping_blink.png'
    : isGirl ? '/sprites/girl_blink.png' : '/sprites/boy_blink.png';

  // Preload sprites once
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const img1 = new window.Image();
      img1.src = '/sprites/boy_blink.png';
      const img2 = new window.Image();
      img2.src = '/sprites/girl_blink.png';
      const img3 = new window.Image();
      img3.src = '/sprites/boy_jumping_blink.png';
      const img4 = new window.Image();
      img4.src = '/sprites/girl_jumping_blink.png';
    }
  }, []);

  // Natural Eye Blinking State
  const [isBlinking, setIsBlinking] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const doubleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const doubleCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (disableBlink) {
      setIsBlinking(false);
      return;
    }

    let isMounted = true;

    const scheduleNextBlink = () => {
      // Natural interval between 2.6s and 4.8s
      const delay = 2600 + Math.random() * 2200;

      timerRef.current = setTimeout(() => {
        if (!isMounted) return;
        setIsBlinking(true);

        // Eyes closed duration: 140ms
        closeTimerRef.current = setTimeout(() => {
          if (!isMounted) return;
          setIsBlinking(false);

          // 22% chance of an immediate cute double-blink
          if (Math.random() < 0.22) {
            doubleTimerRef.current = setTimeout(() => {
              if (!isMounted) return;
              setIsBlinking(true);

              doubleCloseTimerRef.current = setTimeout(() => {
                if (!isMounted) return;
                setIsBlinking(false);
                scheduleNextBlink();
              }, 120);
            }, 110);
          } else {
            scheduleNextBlink();
          }
        }, 140);
      }, delay);
    };

    scheduleNextBlink();

    return () => {
      isMounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (doubleTimerRef.current) clearTimeout(doubleTimerRef.current);
      if (doubleCloseTimerRef.current) clearTimeout(doubleCloseTimerRef.current);
    };
  }, [disableBlink]);

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
      {/* Base Character Sprite */}
      <img
        src={baseSrc}
        alt={isGirl ? 'Murid Perempuan' : 'Murid Laki-laki'}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          imageRendering: 'pixelated',
          pointerEvents: 'none',
        }}
      />

      {/* Eye-blinking Sprite Layer */}
      {!disableBlink && (
        <img
          src={blinkSrc}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
            pointerEvents: 'none',
            opacity: isBlinking ? 1 : 0,
          }}
        />
      )}
    </div>
  );
}

