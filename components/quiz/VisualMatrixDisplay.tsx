'use client';

/**
 * VisualMatrixDisplay.tsx
 * Renders authentic TPA (Tes Potensi Akademik) & Psychometric visual figure pattern matrices.
 * Supports 5 visual puzzle rendering modes matching official exam standards:
 * 1. quadrant_matrix : 2x2 shaded grid boxes
 * 2. clock_hands     : Central dot with rotating line hands (45° angle steps)
 * 3. capsule_symbols : Vertical capsule with dots & corner O/X symbols
 * 4. domino_dots     : Group of dots inside oval containers
 * 5. shapes_row      : Geometric shapes (Triangle, Circle, Square, Star, Diamond)
 */

import React from 'react';

export interface QuadrantBox {
  // Mode 1: Quadrants (2x2 Grid)
  tl?: boolean;
  tr?: boolean;
  bl?: boolean;
  br?: boolean;

  // Mode 2: Clock Hands / Rays (Angles in degrees: 0, 45, 90, 135, 180, 225, 270, 315)
  angles?: number[];

  // Mode 3: Capsule & Symbols
  capsuleTopDot?: boolean; // true: filled, false: outline
  capsuleBottomDot?: boolean;
  symbols?: { pos: 'tl' | 'tr' | 'bl' | 'br'; type: 'circle' | 'cross' }[];

  // Mode 4: Domino / Dot Group Count
  dotCount?: number;

  // Mode 5: Geometry Shapes
  shapeType?:
    | 'circle_outline'
    | 'circle_filled'
    | 'triangle_outline'
    | 'triangle_filled'
    | 'square_outline'
    | 'square_filled'
    | 'star'
    | 'diamond';
  shapeCount?: number; // 1, 2, 3

  isQuestion?: boolean;
}

export interface VisualMatrixData {
  type: 'quadrant_matrix' | 'clock_hands' | 'capsule_symbols' | 'domino_dots' | 'shapes_row';
  title?: string;
  gridCols: number; // 3 for 3x3 matrix
  boxes: QuadrantBox[];
  optionBoxes?: QuadrantBox[]; // Visual boxes corresponding to options A, B, C, D
}

interface VisualMatrixDisplayProps {
  data: VisualMatrixData;
  selectedOption?: number | null;
  revealed?: boolean;
  correctIndex?: number;
  onSelectOption?: (index: number) => void;
}

// ─── SVG CUSTOM PUZZLE RENDERER COMPONENT ───────────────────────────────────

export function QuadrantBoxView({
  box,
  size = 'md',
  highlight = false,
}: {
  box: QuadrantBox;
  size?: 'sm' | 'md' | 'lg';
  highlight?: boolean;
}) {
  const containerSize =
    size === 'sm'
      ? 'w-14 h-14 sm:w-16 sm:h-16'
      : size === 'md'
      ? 'w-18 h-18 sm:w-22 sm:h-22'
      : 'w-22 h-22 sm:w-26 sm:h-26';

  if (box.isQuestion) {
    return (
      <div
        className={`${containerSize} bg-stone-900 border-2 border-cyan-400 rounded-xl flex items-center justify-center shadow-lg animate-pulse`}
      >
        <span className="text-cyan-300 text-2xl sm:text-3xl font-black font-pixel">?</span>
      </div>
    );
  }

  // Detect rendering mode from box data properties
  const isClockHands = box.angles !== undefined;
  const isCapsule = box.capsuleTopDot !== undefined || box.symbols !== undefined;
  const isDomino = box.dotCount !== undefined;
  const isShape = box.shapeType !== undefined;

  return (
    <div
      className={`${containerSize} bg-slate-100 border-2 ${
        highlight ? 'border-cyan-400 ring-2 ring-cyan-400/50' : 'border-slate-800'
      } rounded-xl p-1 shadow-md flex items-center justify-center overflow-hidden transition-all`}
    >
      {/* 1. Mode: Clock Hands / Rays (Angled Line Hands + Center Dot) */}
      {isClockHands && (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Center Black Circle */}
          <circle cx="32" cy="32" r="7" fill="#0f172a" />
          {/* Rays sticking out */}
          {(box.angles || []).map((deg, idx) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const x2 = 32 + 25 * Math.cos(rad);
            const y2 = 32 + 25 * Math.sin(rad);
            return (
              <line
                key={idx}
                x1="32"
                y1="32"
                x2={x2}
                y2={y2}
                stroke="#0f172a"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      )}

      {/* 2. Mode: Capsule & Corner Symbols (Capsule Pill + Circles/Crosses) */}
      {isCapsule && (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Central Pill Capsule */}
          <rect
            x="23"
            y="12"
            width="18"
            height="40"
            rx="9"
            ry="9"
            fill="none"
            stroke="#0f172a"
            strokeWidth="3.5"
          />
          {/* Top Dot */}
          <circle
            cx="32"
            cy="23"
            r="4.5"
            fill={box.capsuleTopDot ? '#0f172a' : '#ffffff'}
            stroke="#0f172a"
            strokeWidth="2.5"
          />
          {/* Bottom Dot */}
          <circle
            cx="32"
            cy="41"
            r="4.5"
            fill={box.capsuleBottomDot ? '#0f172a' : '#ffffff'}
            stroke="#0f172a"
            strokeWidth="2.5"
          />
          {/* Corner Symbols */}
          {(box.symbols || []).map((sym, idx) => {
            const posCoords = {
              tl: { x: 10, y: 12 },
              tr: { x: 54, y: 12 },
              bl: { x: 10, y: 52 },
              br: { x: 54, y: 52 },
            }[sym.pos];

            if (sym.type === 'circle') {
              return (
                <circle
                  key={idx}
                  cx={posCoords.x}
                  cy={posCoords.y}
                  r="4.5"
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="2.5"
                />
              );
            } else {
              return (
                <g key={idx}>
                  <line
                    x1={posCoords.x - 4}
                    y1={posCoords.y - 4}
                    x2={posCoords.x + 4}
                    y2={posCoords.y + 4}
                    stroke="#0f172a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1={posCoords.x + 4}
                    y1={posCoords.y - 4}
                    x2={posCoords.x - 4}
                    y2={posCoords.y + 4}
                    stroke="#0f172a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </g>
              );
            }
          })}
        </svg>
      )}

      {/* 3. Mode: Domino / Dot Grouping */}
      {isDomino && (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <rect
            x="14"
            y="10"
            width="36"
            height="44"
            rx="14"
            ry="14"
            fill="#e2e8f0"
            stroke="#0f172a"
            strokeWidth="3"
          />
          {/* Dot positions for 1 to 8 dots */}
          {(() => {
            const count = box.dotCount || 0;
            const dotCoords = [
              { x: 25, y: 20 },
              { x: 39, y: 20 },
              { x: 25, y: 32 },
              { x: 39, y: 32 },
              { x: 25, y: 44 },
              { x: 39, y: 44 },
              { x: 32, y: 26 },
              { x: 32, y: 38 },
            ];

            return dotCoords.slice(0, count).map((pt, idx) => (
              <circle key={idx} cx={pt.x} cy={pt.y} r="3.5" fill="#0f172a" />
            ));
          })()}
        </svg>
      )}

      {/* 4. Mode: Geometric Shapes (Triangle, Square, Star, Diamond, etc.) */}
      {isShape && (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {box.shapeType === 'circle_filled' && <circle cx="32" cy="32" r="16" fill="#0f172a" />}
          {box.shapeType === 'circle_outline' && (
            <circle cx="32" cy="32" r="16" fill="none" stroke="#0f172a" strokeWidth="4" />
          )}
          {box.shapeType === 'square_filled' && <rect x="16" y="16" width="32" height="32" fill="#0f172a" />}
          {box.shapeType === 'square_outline' && (
            <rect x="16" y="16" width="32" height="32" fill="none" stroke="#0f172a" strokeWidth="4" />
          )}
          {box.shapeType === 'triangle_filled' && (
            <polygon points="32,14 50,48 14,48" fill="#0f172a" />
          )}
          {box.shapeType === 'triangle_outline' && (
            <polygon points="32,14 50,48 14,48" fill="none" stroke="#0f172a" strokeWidth="4" />
          )}
          {box.shapeType === 'diamond' && (
            <polygon points="32,12 50,32 32,52 14,32" fill="#0f172a" />
          )}
          {box.shapeType === 'star' && (
            <polygon
              points="32,12 37,24 50,24 40,32 44,46 32,37 20,46 24,32 14,24 27,24"
              fill="#0f172a"
            />
          )}
        </svg>
      )}

      {/* 5. Default Mode: 2x2 Quadrant Box (Shaded Grid Cells) */}
      {!isClockHands && !isCapsule && !isDomino && !isShape && (
        <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5">
          <div
            className={`rounded-tl-sm transition-colors ${
              box.tl ? 'bg-slate-900' : 'bg-slate-200 border border-slate-300'
            }`}
          />
          <div
            className={`rounded-tr-sm transition-colors ${
              box.tr ? 'bg-slate-900' : 'bg-slate-200 border border-slate-300'
            }`}
          />
          <div
            className={`rounded-bl-sm transition-colors ${
              box.bl ? 'bg-slate-900' : 'bg-slate-200 border border-slate-300'
            }`}
          />
          <div
            className={`rounded-br-sm transition-colors ${
              box.br ? 'bg-slate-900' : 'bg-slate-200 border border-slate-300'
            }`}
          />
        </div>
      )}
    </div>
  );
}

export default function VisualMatrixDisplay({
  data,
  selectedOption,
  revealed,
  correctIndex,
  onSelectOption,
}: VisualMatrixDisplayProps) {
  const OPTION_LABELS = ['A', 'B', 'C', 'D'];

  return (
    <div className="w-full flex flex-col items-center gap-3 my-2">
      {/* 3x3 Visual Grid Matrix Display Card */}
      <div className="bg-slate-950/90 border-2 border-cyan-400/80 rounded-xl p-3 sm:p-4 shadow-[0_0_20px_rgba(6,182,212,0.3)] flex flex-col items-center">
        <div className="text-xs sm:text-sm font-bold text-cyan-300 mb-2.5 font-dialogue tracking-wide flex items-center gap-1.5">
          <span>🧩</span>
          <span>{data.title || 'LENGKAPI POLA GAMBAR MATRIKS KOTAK YANG KOSONG (?)'}</span>
        </div>

        <div
          className={`grid gap-2 sm:gap-3 items-center justify-center ${
            data.gridCols === 3 ? 'grid-cols-3' : 'grid-cols-4'
          }`}
        >
          {data.boxes.map((box, i) => (
            <QuadrantBoxView key={i} box={box} size="md" />
          ))}
        </div>
      </div>

      {/* Visual Options Grid (A, B, C, D rendered as figure boxes!) */}
      {data.optionBoxes && data.optionBoxes.length === 4 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full mt-1">
          {data.optionBoxes.map((optBox, i) => {
            let stateClass =
              'border-slate-700 bg-slate-900/90 hover:border-cyan-400 hover:bg-slate-800';
            if (revealed) {
              if (i === correctIndex) {
                stateClass = 'border-emerald-500 bg-emerald-950/90 ring-2 ring-emerald-400';
              } else if (i === selectedOption) {
                stateClass = 'border-red-500 bg-red-950/90 ring-2 ring-red-400';
              } else {
                stateClass = 'border-slate-800 bg-slate-950/50 opacity-40';
              }
            } else if (i === selectedOption) {
              stateClass = 'border-cyan-400 bg-cyan-950/90 ring-2 ring-cyan-400';
            }

            return (
              <button
                key={i}
                onClick={() => onSelectOption && onSelectOption(i)}
                disabled={revealed}
                className={`flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border-2 transition-all cursor-pointer ${stateClass}`}
              >
                <QuadrantBoxView box={optBox} size="sm" />
                <span className="font-bold text-sm sm:text-base text-cyan-300 mt-1.5 font-dialogue">
                  Opsi {OPTION_LABELS[i]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
