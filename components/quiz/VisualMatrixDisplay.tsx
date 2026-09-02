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

  // Mode 6: Pentagon & Arrow (Reference Row 1)
  pentagonData?: {
    arrowAngle: number; // angle in deg: 0, 45, 72, 90, 144, 180, etc.
    dotVertex: number; // vertex index 0..4
  };

  // Mode 7: Pointer Hand Circle with Orbiting Dot & Corner Icons (Reference Row 2)
  pointerCircleData?: {
    dotPositionAngle: number; // 0, 45, 90, 135, 180, 225, 270, 315
  };

  // Mode 8: Rotating Ring Notch / Arc (Reference Row 3)
  ringNotchData?: {
    angle: number; // rotation deg 0..360
  };

  // Mode 9: Nested / Concentric Geometric Shapes (Reference Row 4)
  nestedShapeData?: {
    outerShape: 'circle' | 'triangle' | 'square' | 'diamond';
    innerShape: 'circle' | 'triangle' | 'square' | 'diamond';
    innerFilled?: boolean;
  };

  // Mode 10: Spiderweb Network with Lightning & Bug (Reference Row 5)
  spiderwebData?: {
    lightningBranches: number[]; // array of vertex indices 0..4 receiving lightning
    bugVertex: number; // vertex index 0..4 where spider/bug sits
  };

  // Mode 11: Quadrant Grid with Outer Corner Orbiting Dot (Reference Row 6)
  gridOuterDotData?: {
    tl?: boolean;
    tr?: boolean;
    bl?: boolean;
    br?: boolean;
    outerDotPos: 'tl' | 'tr' | 'br' | 'bl';
  };

  // Mode 12: Central Shape with Orbiting Satellite Dots Ring (Reference Row 7)
  orbitDotsData?: {
    centerShape: 'diamond' | 'square' | 'triangle' | 'circle';
    centerFilled?: boolean;
    activeDots: number[]; // indices 0..5 of filled outer dots
  };

  isQuestion?: boolean;
}

export interface VisualMatrixData {
  type:
    | 'quadrant_matrix'
    | 'clock_hands'
    | 'capsule_symbols'
    | 'domino_dots'
    | 'shapes_row'
    | 'pentagon_arrow'
    | 'pointer_circle'
    | 'ring_notch'
    | 'nested_shapes'
    | 'spiderweb_network'
    | 'grid_outer_dot'
    | 'orbit_dots';
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
  const isPentagon = box.pentagonData !== undefined;
  const isPointerCircle = box.pointerCircleData !== undefined;
  const isRingNotch = box.ringNotchData !== undefined;
  const isNestedShape = box.nestedShapeData !== undefined;
  const isSpiderweb = box.spiderwebData !== undefined;
  const isGridOuterDot = box.gridOuterDotData !== undefined;
  const isOrbitDots = box.orbitDotsData !== undefined;

  const isCustomSvg =
    isClockHands ||
    isCapsule ||
    isDomino ||
    isShape ||
    isPentagon ||
    isPointerCircle ||
    isRingNotch ||
    isNestedShape ||
    isSpiderweb ||
    isGridOuterDot ||
    isOrbitDots;

  return (
    <div
      className={`${containerSize} bg-slate-100 border-2 ${
        highlight ? 'border-cyan-400 ring-2 ring-cyan-400/50' : 'border-slate-800'
      } rounded-xl p-1 shadow-md flex items-center justify-center overflow-hidden transition-all`}
    >
      {/* 1. Mode: Clock Hands / Rays */}
      {isClockHands && (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="32" r="7" fill="#0f172a" />
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

      {/* 2. Mode: Capsule & Corner Symbols */}
      {isCapsule && (
        <svg viewBox="0 0 64 64" className="w-full h-full">
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
          <circle
            cx="32"
            cy="23"
            r="4.5"
            fill={box.capsuleTopDot ? '#0f172a' : '#ffffff'}
            stroke="#0f172a"
            strokeWidth="2.5"
          />
          <circle
            cx="32"
            cy="41"
            r="4.5"
            fill={box.capsuleBottomDot ? '#0f172a' : '#ffffff'}
            stroke="#0f172a"
            strokeWidth="2.5"
          />
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

      {/* 4. Mode: Geometric Shapes */}
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

      {/* 6. Mode: Pentagon & Arrow (Reference Row 1) */}
      {isPentagon && box.pentagonData && (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <polygon
            points="32,10 54,26 45,52 19,52 10,26"
            fill="none"
            stroke="#0f172a"
            strokeWidth="3"
          />
          <polygon points="32,26 38,32 32,38 26,32" fill="#0f172a" />
          <circle cx="32" cy="32" r="2" fill="#ffffff" />
          {(() => {
            const rad = ((box.pentagonData.arrowAngle - 90) * Math.PI) / 180;
            const ax = 32 + 18 * Math.cos(rad);
            const ay = 32 + 18 * Math.sin(rad);
            return (
              <g>
                <line x1="32" y1="32" x2={ax} y2={ay} stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
                <circle cx={ax} cy={ay} r="3" fill="#0f172a" />
              </g>
            );
          })()}
          {(() => {
            const vCoords = [
              { x: 32, y: 10 },
              { x: 54, y: 26 },
              { x: 45, y: 52 },
              { x: 19, y: 52 },
              { x: 10, y: 26 },
            ];
            const v = vCoords[box.pentagonData.dotVertex % 5];
            return (
              <circle
                cx={v.x}
                cy={v.y}
                r="4.5"
                fill="#ffffff"
                stroke="#0f172a"
                strokeWidth="2.5"
              />
            );
          })()}
        </svg>
      )}

      {/* 7. Mode: Pointer Hand Circle & Orbit Dot (Reference Row 2) */}
      {isPointerCircle && box.pointerCircleData && (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <path
            d="M 8 10 Q 14 10 16 12 L 20 12 C 21 12 21 14 19 14 L 14 14 Q 12 14 10 12 Z"
            fill="#0f172a"
          />
          <circle cx="11" cy="11" r="3" fill="#0f172a" />
          <line x1="13" y1="11" x2="20" y2="11" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />

          <polygon points="12,50 14,54 18,54 15,57 16,61 12,58 8,61 9,57 6,54 10,54" fill="#0f172a" />

          <path d="M 50 50 A 7 7 0 0 1 50 62 Z" fill="#0f172a" />

          <circle cx="34" cy="34" r="14" fill="none" stroke="#0f172a" strokeWidth="3" />

          {(() => {
            const rad = ((box.pointerCircleData.dotPositionAngle - 90) * Math.PI) / 180;
            const dx = 34 + 14 * Math.cos(rad);
            const dy = 34 + 14 * Math.sin(rad);
            return <circle cx={dx} cy={dy} r="4" fill="#0f172a" stroke="#ffffff" strokeWidth="1" />;
          })()}
        </svg>
      )}

      {/* 8. Mode: Rotating Ring Notch / Arc (Reference Row 3) */}
      {isRingNotch && box.ringNotchData && (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <g transform={`rotate(${box.ringNotchData.angle}, 32, 32)`}>
            <circle cx="32" cy="32" r="18" fill="#0f172a" />
            <circle cx="32" cy="32" r="10" fill="#ffffff" />
            <polygon points="32,32 44,14 52,24" fill="#ffffff" />
            <polygon points="32,24 38,32 32,40 26,32" fill="#0f172a" />
          </g>
        </svg>
      )}

      {/* 9. Mode: Concentric / Nested Shapes (Reference Row 4) */}
      {isNestedShape && box.nestedShapeData && (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {box.nestedShapeData.outerShape === 'circle' && (
            <circle cx="32" cy="32" r="22" fill="#0f172a" />
          )}
          {box.nestedShapeData.outerShape === 'triangle' && (
            <polygon points="32,8 56,54 8,54" fill="#0f172a" />
          )}
          {box.nestedShapeData.outerShape === 'square' && (
            <rect x="10" y="10" width="44" height="44" fill="#0f172a" />
          )}
          {box.nestedShapeData.outerShape === 'diamond' && (
            <polygon points="32,8 56,32 32,56 8,32" fill="#0f172a" />
          )}

          {box.nestedShapeData.innerShape === 'circle' && (
            <circle
              cx="32"
              cy="32"
              r="11"
              fill={box.nestedShapeData.innerFilled ? '#0f172a' : '#ffffff'}
              stroke="#ffffff"
              strokeWidth="2"
            />
          )}
          {box.nestedShapeData.innerShape === 'triangle' && (
            <polygon
              points="32,20 44,42 20,42"
              fill={box.nestedShapeData.innerFilled ? '#0f172a' : '#ffffff'}
              stroke="#ffffff"
              strokeWidth="2"
            />
          )}
          {box.nestedShapeData.innerShape === 'square' && (
            <rect
              x="21"
              y="21"
              width="22"
              height="22"
              fill={box.nestedShapeData.innerFilled ? '#0f172a' : '#ffffff'}
              stroke="#ffffff"
              strokeWidth="2"
            />
          )}
          {box.nestedShapeData.innerShape === 'diamond' && (
            <polygon
              points="32,18 46,32 32,46 18,32"
              fill={box.nestedShapeData.innerFilled ? '#0f172a' : '#ffffff'}
              stroke="#ffffff"
              strokeWidth="2"
            />
          )}
        </svg>
      )}

      {/* 10. Mode: Spiderweb Network & Lightning (Reference Row 5) */}
      {isSpiderweb && box.spiderwebData && (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <polygon points="32,8 54,24 45,54 19,54 10,24" fill="none" stroke="#0f172a" strokeWidth="2" />
          <polygon points="32,20 43,28 39,43 25,43 21,28" fill="none" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="32" y1="32" x2="32" y2="8" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="32" y1="32" x2="54" y2="24" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="32" y1="32" x2="45" y2="54" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="32" y1="32" x2="19" y2="54" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="32" y1="32" x2="10" y2="24" stroke="#0f172a" strokeWidth="1.5" />

          {box.spiderwebData.lightningBranches.map((vIdx) => {
            const vCoords = [
              { x: 32, y: 4 },
              { x: 56, y: 20 },
              { x: 47, y: 56 },
              { x: 17, y: 56 },
              { x: 8, y: 20 },
            ];
            const v = vCoords[vIdx % 5];
            return (
              <polygon
                key={vIdx}
                points={`${v.x},${v.y-4} ${v.x-3},${v.y+1} ${v.x+1},${v.y+1} ${v.x-2},${v.y+6} ${v.x+4},${v.y-1} ${v.x},${v.y-1}`}
                fill="#0f172a"
              />
            );
          })}

          {(() => {
            const vCoords = [
              { x: 32, y: 8 },
              { x: 54, y: 24 },
              { x: 45, y: 54 },
              { x: 19, y: 54 },
              { x: 10, y: 24 },
            ];
            const bug = vCoords[box.spiderwebData.bugVertex % 5];
            return (
              <g>
                <circle cx={bug.x} cy={bug.y} r="4" fill="#0f172a" />
                <line x1={bug.x-5} y1={bug.y-3} x2={bug.x+5} y2={bug.y+3} stroke="#0f172a" strokeWidth="1.5" />
                <line x1={bug.x-5} y1={bug.y+3} x2={bug.x+5} y2={bug.y-3} stroke="#0f172a" strokeWidth="1.5" />
              </g>
            );
          })()}
        </svg>
      )}

      {/* 11. Mode: Grid 2x2 with Outer Corner Satellite Dot (Reference Row 6) */}
      {isGridOuterDot && box.gridOuterDotData && (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <rect x="18" y="18" width="28" height="28" fill="none" stroke="#0f172a" strokeWidth="2.5" />
          <line x1="32" y1="18" x2="32" y2="46" stroke="#0f172a" strokeWidth="2" />
          <line x1="18" y1="32" x2="46" y2="32" stroke="#0f172a" strokeWidth="2" />

          {box.gridOuterDotData.tl && <rect x="19" y="19" width="12" height="12" fill="#0f172a" />}
          {box.gridOuterDotData.tr && <rect x="33" y="19" width="12" height="12" fill="#0f172a" />}
          {box.gridOuterDotData.bl && <rect x="19" y="33" width="12" height="12" fill="#0f172a" />}
          {box.gridOuterDotData.br && <rect x="33" y="33" width="12" height="12" fill="#0f172a" />}

          {(() => {
            const pos = box.gridOuterDotData.outerDotPos;
            const dotCoord = {
              tl: { x: 10, y: 10 },
              tr: { x: 54, y: 10 },
              br: { x: 54, y: 54 },
              bl: { x: 10, y: 54 },
            }[pos];
            return <circle cx={dotCoord.x} cy={dotCoord.y} r="4.5" fill="#0f172a" />;
          })()}
        </svg>
      )}

      {/* 12. Mode: Central Shape with Orbiting Satellite Dots Ring (Reference Row 7) */}
      {isOrbitDots && box.orbitDotsData && (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {box.orbitDotsData.centerShape === 'circle' && (
            <circle
              cx="32"
              cy="32"
              r="12"
              fill={box.orbitDotsData.centerFilled ? '#0f172a' : '#ffffff'}
              stroke="#0f172a"
              strokeWidth="3"
            />
          )}
          {box.orbitDotsData.centerShape === 'square' && (
            <rect
              x="22"
              y="22"
              width="20"
              height="20"
              fill={box.orbitDotsData.centerFilled ? '#0f172a' : '#ffffff'}
              stroke="#0f172a"
              strokeWidth="3"
            />
          )}
          {box.orbitDotsData.centerShape === 'triangle' && (
            <polygon
              points="32,18 44,40 20,40"
              fill={box.orbitDotsData.centerFilled ? '#0f172a' : '#ffffff'}
              stroke="#0f172a"
              strokeWidth="3"
            />
          )}
          {box.orbitDotsData.centerShape === 'diamond' && (
            <polygon
              points="32,18 44,32 32,46 20,32"
              fill={box.orbitDotsData.centerFilled ? '#0f172a' : '#ffffff'}
              stroke="#0f172a"
              strokeWidth="3"
            />
          )}

          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const rad = ((idx * 60 - 90) * Math.PI) / 180;
            const dx = 32 + 22 * Math.cos(rad);
            const dy = 32 + 22 * Math.sin(rad);
            const isActive = box.orbitDotsData?.activeDots.includes(idx);
            return (
              <circle
                key={idx}
                cx={dx}
                cy={dy}
                r="3.5"
                fill={isActive ? '#0f172a' : '#ffffff'}
                stroke="#0f172a"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      )}

      {/* 5. Default Mode: 2x2 Quadrant Box (Shaded Grid Cells) */}
      {!isCustomSvg && (
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
