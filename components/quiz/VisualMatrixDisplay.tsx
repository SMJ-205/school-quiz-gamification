'use client';

/**
 * VisualMatrixDisplay.tsx
 * Renders 2D visual figure pattern matrices (e.g. 3x3 grid of 2x2 quadrant boxes)
 * matching official psikotes / spatial reasoning puzzle formats (Grade 1-6 SD).
 */

import React from 'react';

export interface QuadrantBox {
  tl: boolean; // Top-Left shaded
  tr: boolean; // Top-Right shaded
  bl: boolean; // Bottom-Left shaded
  br: boolean; // Bottom-Right shaded
  isQuestion?: boolean;
}

export interface VisualMatrixData {
  type: 'quadrant_matrix' | 'domino' | 'shape_rotation';
  title?: string;
  gridCols: number; // 3 for 3x3, 4 for 1x4 sequence
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
      ? 'w-12 h-12 sm:w-14 sm:h-14 p-1'
      : size === 'md'
      ? 'w-16 h-16 sm:w-20 sm:h-20 p-1.5'
      : 'w-20 h-20 sm:w-24 sm:h-24 p-2';

  if (box.isQuestion) {
    return (
      <div
        className={`${containerSize} bg-stone-900 border-2 border-amber-400/90 rounded-lg flex items-center justify-center shadow-md animate-pulse`}
      >
        <span className="text-amber-300 text-2xl sm:text-3xl font-black font-pixel">?</span>
      </div>
    );
  }

  return (
    <div
      className={`${containerSize} bg-stone-100 border-2 ${
        highlight ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-stone-800'
      } rounded-lg grid grid-cols-2 grid-rows-2 gap-0.5 shadow-md`}
    >
      <div
        className={`rounded-tl-sm transition-colors ${
          box.tl ? 'bg-stone-900' : 'bg-stone-200 border border-stone-300'
        }`}
      />
      <div
        className={`rounded-tr-sm transition-colors ${
          box.tr ? 'bg-stone-900' : 'bg-stone-200 border border-stone-300'
        }`}
      />
      <div
        className={`rounded-bl-sm transition-colors ${
          box.bl ? 'bg-stone-900' : 'bg-stone-200 border border-stone-300'
        }`}
      />
      <div
        className={`rounded-br-sm transition-colors ${
          box.br ? 'bg-stone-900' : 'bg-stone-200 border border-stone-300'
        }`}
      />
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
      {/* 3x3 or 1x4 Visual Grid Matrix */}
      <div className="bg-stone-950/80 border-2 border-amber-500/60 rounded-xl p-3 sm:p-4 shadow-xl flex flex-col items-center">
        <div className="text-xs sm:text-sm font-bold text-amber-300 mb-2.5 font-dialogue tracking-wide">
          🧩 LENGKAPI POLA GAMBAR KOTAK YANG KOSONG (?)
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
              'border-stone-700 bg-stone-900/90 hover:border-amber-400 hover:bg-stone-800';
            if (revealed) {
              if (i === correctIndex) {
                stateClass = 'border-emerald-500 bg-emerald-950/80 ring-2 ring-emerald-400';
              } else if (i === selectedOption) {
                stateClass = 'border-red-500 bg-red-950/80 ring-2 ring-red-400';
              } else {
                stateClass = 'border-stone-800 bg-stone-950/50 opacity-40';
              }
            } else if (i === selectedOption) {
              stateClass = 'border-amber-400 bg-amber-950/80 ring-2 ring-amber-400';
            }

            return (
              <button
                key={i}
                onClick={() => onSelectOption && onSelectOption(i)}
                disabled={revealed}
                className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border-2 transition-all cursor-pointer ${stateClass}`}
              >
                <QuadrantBoxView box={optBox} size="sm" />
                <span className="font-bold text-sm sm:text-base text-amber-300 mt-1.5 font-dialogue">
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
