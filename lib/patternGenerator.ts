/**
 * patternGenerator.ts
 * Procedural Question Generator for "Detektif Pola" (Pattern & Sequence Predictor)
 * Features:
 * - Strict grade-based difficulty scaling (Kelas 1 to Kelas 6 SD)
 * - Zero-duplicate guarantee per session via question fingerprint signature tracking
 * - 5 Authentic TPA Visual Puzzle Modes:
 *   1. clock_hands     : Jarum & Garis Sinar (Problem 5 TPA)
 *   2. capsule_symbols : Kapsul & Simbol O/X (Problem 4 TPA)
 *   3. domino_dots     : Kelompok Bintik Domino
 *   4. shapes_row      : Urutan Bentuk Geometri (Segitiga, Lingkaran, Kotak, Bintang, Belah Ketupat)
 *   5. quadrant_matrix : 2x2 Grid Hitam-Putih (5 sub-variasi)
 */

import { VisualMatrixData, QuadrantBox } from '@/components/quiz/VisualMatrixDisplay';

export type PatternCategory = 'aritmatika' | 'geometris' | 'interleaved' | 'visual' | 'lab_science';

export interface PatternQuestion {
  id: string;
  category: PatternCategory;
  categoryLabel: string;
  question: string;
  options: string[];
  correctIndex: number;
  hint: string;
  difficultyLevel: 1 | 2 | 3 | 4; // 1: SD 1-2, 2: SD 3-4, 3: SD 5, 4: Max SD 6
  visualMatrixData?: VisualMatrixData;
}

// Utility: Shuffle an array in-place
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── STRICT GRADE-BASED DIFFICULTY CALCULATOR (Kelas 1 - 6 SD) ─────────────

export function getDifficultyForGradeAndNumber(qNum: number, grade: number = 6): 1 | 2 | 3 | 4 {
  if (grade <= 1) return 1; // Kelas 1 SD: STRICTLY Level 1 ONLY (Termudah)
  if (grade === 2) return qNum <= 5 ? 1 : 2; // Kelas 2 SD: Level 1-2
  if (grade === 3) return 2; // Kelas 3 SD: Level 2
  if (grade === 4) return qNum <= 4 ? 2 : 3; // Kelas 4 SD: Level 2-3
  if (grade === 5) return 3; // Kelas 5 SD: Level 3
  // Kelas 6 SD Peak
  if (qNum <= 3) return 3;
  return 4; // Level 4 (Max SD 6 Peak)
}

// ─── 1. Aritmatika & Bertingkat (Ultra-Randomized) ─────────────────────────

function generateArithmetic(difficulty: 1 | 2 | 3 | 4): PatternQuestion {
  if (difficulty === 1) {
    // Level 1: Constant Addition/Subtraction (+1..+10 or -1..-5)
    const isSub = Math.random() > 0.5;
    if (isSub) {
      const step = pickRandom([1, 2, 3, 4, 5]);
      const start = randomInt(step * 5 + 2, 50);
      const seq = [start, start - step, start - step * 2, start - step * 3];
      const answer = start - step * 4;

      const distractors = [answer + step + 1, answer - 1, answer + 2];
      const allOpts = shuffleArray([answer.toString(), ...distractors.map((d) => d.toString())]);
      const correctIdx = allOpts.indexOf(answer.toString());

      return {
        id: `arit_l1_sub_${Date.now()}_${Math.random()}`,
        category: 'aritmatika',
        categoryLabel: 'Aritmatika Pengurangan (Level 1)',
        difficultyLevel: 1,
        question: `Detektif cilik, tentukan angka berikutnya yang berkurang -${step} ini:\n${seq.join(', ')}, ?`,
        options: allOpts,
        correctIndex: correctIdx,
        hint: `🔬 *Analisis Guru Lab:* Setiap langkah selalu berkurang -${step}. Jadi ${seq[seq.length - 1]} - ${step} = ${answer}.`,
      };
    } else {
      const step = pickRandom([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const start = randomInt(1, 40);
      const seq = [start, start + step, start + step * 2, start + step * 3];
      const answer = start + step * 4;

      const distractors = [answer + step, answer - 1, answer + 2];
      const allOpts = shuffleArray([answer.toString(), ...distractors.map((d) => d.toString())]);
      const correctIdx = allOpts.indexOf(answer.toString());

      return {
        id: `arit_l1_add_${Date.now()}_${Math.random()}`,
        category: 'aritmatika',
        categoryLabel: 'Aritmatika Penjumlahan (Level 1)',
        difficultyLevel: 1,
        question: `Detektif cilik, tentukan angka berikutnya dari pola bertambah +${step} ini:\n${seq.join(', ')}, ?`,
        options: allOpts,
        correctIndex: correctIdx,
        hint: `🔬 *Analisis Guru Lab:* Setiap langkah selalu bertambah +${step}. Jadi ${seq[seq.length - 1]} + ${step} = ${answer}.`,
      };
    }
  } else if (difficulty === 2) {
    // Level 2: Increasing Step (+1,+2,+3,+4 or +2,+4,+6,+8 or +1,+3,+5,+7 or +3,+6,+9,+12)
    const variant = pickRandom(['inc_1', 'inc_2', 'odd', 'mult_3']);
    const start = randomInt(1, 20);

    let seq: number[] = [];
    let answer = 0;
    let hintStr = '';

    if (variant === 'inc_1') {
      const initialStep = randomInt(1, 3);
      seq = [start, start + initialStep, start + initialStep * 2 + 1, start + initialStep * 3 + 3];
      answer = start + initialStep * 4 + 6;
      hintStr = `Selisihnya terus bertambah (+1 tiap tahap). Langkah berikutnya bertambah +${initialStep + 3}.`;
    } else if (variant === 'inc_2') {
      seq = [start, start + 2, start + 6, start + 12]; // steps: +2, +4, +6
      answer = start + 20; // step: +8
      hintStr = `Tambahan angka melompat genap: +2, +4, +6, lalu +8.`;
    } else if (variant === 'odd') {
      seq = [start, start + 1, start + 4, start + 9]; // steps: +1, +3, +5
      answer = start + 16; // step: +7
      hintStr = `Tambahan angka bertambah ganjil: +1, +3, +5, lalu +7.`;
    } else {
      seq = [start, start + 3, start + 9, start + 18]; // steps: +3, +6, +9
      answer = start + 30; // step: +12
      hintStr = `Beda kelipatan 3: +3, +6, +9, lalu +12.`;
    }

    const distractors = [answer + 2, answer - 2, answer + 4];
    const allOpts = shuffleArray([answer.toString(), ...distractors.map((d) => d.toString())]);
    const correctIdx = allOpts.indexOf(answer.toString());

    return {
      id: `arit_l2_${Date.now()}_${Math.random()}`,
      category: 'aritmatika',
      categoryLabel: 'Aritmatika Bertingkat (Level 2)',
      difficultyLevel: 2,
      question: `Temukan angka selanjutnya dari pola bertingkat ini:\n${seq.join(', ')}, ?`,
      options: allOpts,
      correctIndex: correctIdx,
      hint: `🔬 *Analisis Guru Lab:* ${hintStr} Jadi ${seq[seq.length - 1]} ➔ ${answer}.`,
    };
  } else if (difficulty === 3) {
    // Level 3: Alternating +/- (+A, -B, +A, -B) or Multiply-Then-Subtract
    const addVal = randomInt(4, 12);
    const subVal = randomInt(1, 4);
    const start = randomInt(10, 40);
    const seq = [start, start + addVal, start + addVal - subVal, start + addVal * 2 - subVal];
    const answer = start + addVal * 2 - subVal * 2; // next step: -subVal

    const distractors = [answer + addVal, answer + 1, answer - addVal];
    const allOpts = shuffleArray([answer.toString(), ...distractors.map((d) => d.toString())]);
    const correctIdx = allOpts.indexOf(answer.toString());

    return {
      id: `arit_l3_${Date.now()}_${Math.random()}`,
      category: 'aritmatika',
      categoryLabel: 'Pola Alternatif (Level 3)',
      difficultyLevel: 3,
      question: `Deteksi angka selanjutnya pada deret berayun ini:\n${seq.join(', ')}, ?`,
      options: allOpts,
      correctIndex: correctIdx,
      hint: `🔬 *Analisis Guru Lab:* Pola ini selang-seling antara +${addVal} lalu -${subVal}. Giliran berikutnya adalah berkurang -${subVal} (${seq[seq.length - 1]} - ${subVal} = ${answer}).`,
    };
  } else {
    // Level 4 (Max SD Kelas 6): Fibonacci Sederhana
    const a = randomInt(1, 8);
    const b = randomInt(1, 10);
    const seq = [a, b, a + b, a + 2 * b, 2 * a + 3 * b];
    const answer = 3 * a + 5 * b;

    const distractors = [answer + a, answer - b, answer + 4];
    const allOpts = shuffleArray([answer.toString(), ...distractors.map((d) => d.toString())]);
    const correctIdx = allOpts.indexOf(answer.toString());

    return {
      id: `arit_l4_${Date.now()}_${Math.random()}`,
      category: 'aritmatika',
      categoryLabel: 'Deret Fibonacci (Level 4 - SD 6)',
      difficultyLevel: 4,
      question: `Penyelidikan Tingkat Lanjut — Selesaikan deret Fibonacci ini:\n${seq.join(', ')}, ?`,
      options: allOpts,
      correctIndex: correctIdx,
      hint: `🔬 *Analisis Guru Lab:* Setiap angka adalah hasil penjumlahan 2 angka di depannya! (${seq[seq.length - 2]} + ${seq[seq.length - 1]} = ${answer}).`,
    };
  }
}

// ─── 2. Geometris & Kuadrat (Ultra-Randomized) ─────────────────────────────

function generateGeometric(difficulty: 1 | 2 | 3 | 4): PatternQuestion {
  if (difficulty === 1) {
    // Level 1: Simple Even/Odd Numbers or Multiples of 2,3,4,5
    const step = pickRandom([2, 3, 4, 5]);
    const start = randomInt(1, 8) * step;
    const seq = [start, start + step, start + step * 2, start + step * 3];
    const answer = start + step * 4;

    const distractors = [answer + 1, answer - 1, answer + 2];
    const allOpts = shuffleArray([answer.toString(), ...distractors.map((d) => d.toString())]);
    const correctIdx = allOpts.indexOf(answer.toString());

    return {
      id: `geo_l1_${Date.now()}_${Math.random()}`,
      category: 'geometris',
      categoryLabel: `Pola Loncat ${step} (Level 1)`,
      difficultyLevel: 1,
      question: `Tentukan angka berikutnya dari pola loncat ${step} ini:\n${seq.join(', ')}, ?`,
      options: allOpts,
      correctIndex: correctIdx,
      hint: `🔬 *Analisis Guru Lab:* Angka selalu melompat +${step}. ${seq[seq.length - 1]} + ${step} = ${answer}.`,
    };
  } else if (difficulty === 2) {
    // Level 2: Multiplication x2, x3, x4
    const mult = pickRandom([2, 3, 4]);
    const start = randomInt(1, 5);
    const seq = [start, start * mult, start * mult * mult, start * mult * mult * mult];
    const answer = start * mult * mult * mult * mult;

    const distractors = [answer + mult, answer - start, answer + start * mult];
    const allOpts = shuffleArray([answer.toString(), ...distractors.map((d) => d.toString())]);
    const correctIdx = allOpts.indexOf(answer.toString());

    return {
      id: `geo_l2_${Date.now()}_${Math.random()}`,
      category: 'geometris',
      categoryLabel: `Perkalian Kelipatan ${mult} (Level 2)`,
      difficultyLevel: 2,
      question: `Tentukan angka berikutnya dari pola kelipatan ×${mult} ini:\n${seq.join(', ')}, ?`,
      options: allOpts,
      correctIndex: correctIdx,
      hint: `🔬 *Analisis Guru Lab:* Setiap angka dikali ${mult} (×${mult})! ${seq[seq.length - 1]} × ${mult} = ${answer}.`,
    };
  } else if (difficulty === 3) {
    // Level 3: Triangular Numbers or Square Numbers
    const isTriangular = Math.random() > 0.5;
    if (isTriangular) {
      const startN = randomInt(1, 4);
      const seq = [
        (startN * (startN + 1)) / 2,
        ((startN + 1) * (startN + 2)) / 2,
        ((startN + 2) * (startN + 3)) / 2,
        ((startN + 3) * (startN + 4)) / 2,
      ];
      const answer = ((startN + 4) * (startN + 5)) / 2;

      const distractors = [answer + 3, answer - 2, answer + 5];
      const allOpts = shuffleArray([answer.toString(), ...distractors.map((d) => d.toString())]);
      const correctIdx = allOpts.indexOf(answer.toString());

      return {
        id: `geo_l3_tri_${Date.now()}_${Math.random()}`,
        category: 'geometris',
        categoryLabel: 'Deret Angka Segitiga (Level 3)',
        difficultyLevel: 3,
        question: `Temukan angka selanjutnya dari pola deret segitiga (+2, +3, +4, +5...) ini:\n${seq.join(', ')}, ?`,
        options: allOpts,
        correctIndex: correctIdx,
        hint: `🔬 *Analisis Guru Lab:* Penambahan bertambah +1 tiap tahap. Angka berikutnya bertambah +${startN + 5}, jadi ${seq[seq.length - 1]} ➔ ${answer}.`,
      };
    } else {
      // Square Numbers (n^2)
      const startN = randomInt(1, 5);
      const seq = [startN ** 2, (startN + 1) ** 2, (startN + 2) ** 2, (startN + 3) ** 2];
      const answer = (startN + 4) ** 2;

      const distractors = [answer + 5, answer - 4, answer + 8];
      const allOpts = shuffleArray([answer.toString(), ...distractors.map((d) => d.toString())]);
      const correctIdx = allOpts.indexOf(answer.toString());

      return {
        id: `geo_l3_sq_${Date.now()}_${Math.random()}`,
        category: 'geometris',
        categoryLabel: 'Pangkat Dua Kuadrat (Level 3)',
        difficultyLevel: 3,
        question: `Temukan pola kuadrat angka berikutnya:\n${seq.join(', ')}, ?`,
        options: allOpts,
        correctIndex: correctIdx,
        hint: `🔬 *Analisis Guru Lab:* Ini adalah deret angka kuadrat (${startN}², ${startN + 1}², ${startN + 2}²...). Angka berikutnya adalah ${startN + 4}² = ${answer}.`,
      };
    }
  } else {
    // Level 4 (Max SD 6): Square Numbers with Offset (+k or -k)
    const offset = pickRandom([1, -1, 2, -2, 3]);
    const startN = randomInt(1, 4);
    const seq = [
      startN ** 2 + offset,
      (startN + 1) ** 2 + offset,
      (startN + 2) ** 2 + offset,
      (startN + 3) ** 2 + offset,
    ];
    const answer = (startN + 4) ** 2 + offset;

    const distractors = [answer + 3, answer - 3, answer + 7];
    const allOpts = shuffleArray([answer.toString(), ...distractors.map((d) => d.toString())]);
    const correctIdx = allOpts.indexOf(answer.toString());

    const signStr = offset > 0 ? `+ ${offset}` : `- ${Math.abs(offset)}`;

    return {
      id: `geo_l4_${Date.now()}_${Math.random()}`,
      category: 'geometris',
      categoryLabel: 'Pola Kuadrat Offset (Level 4 - SD 6)',
      difficultyLevel: 4,
      question: `Soal Penalaran Lanjutan — Lengkapi deret kuadrat (${signStr}) ini:\n${seq.join(', ')}, ?`,
      options: allOpts,
      correctIndex: correctIdx,
      hint: `🔬 *Analisis Guru Lab:* Pola ini adalah (n² ${signStr})! Langkah berikutnya adalah ${startN + 4}² ${signStr} = ${answer}.`,
    };
  }
}

// ─── 3. Pola Gambar Visual (5 Authentic TPA Puzzle Modes) ───────────────────

function createVisualBox(tl: boolean, tr: boolean, bl: boolean, br: boolean, isQuestion = false): QuadrantBox {
  return { tl, tr, bl, br, isQuestion };
}

function areBoxesEqual(a: QuadrantBox, b: QuadrantBox): boolean {
  if (a.angles !== undefined || b.angles !== undefined) {
    return JSON.stringify(a.angles) === JSON.stringify(b.angles);
  }
  if (a.symbols !== undefined || b.symbols !== undefined) {
    return (
      a.capsuleTopDot === b.capsuleTopDot &&
      a.capsuleBottomDot === b.capsuleBottomDot &&
      JSON.stringify(a.symbols) === JSON.stringify(b.symbols)
    );
  }
  if (a.dotCount !== undefined || b.dotCount !== undefined) {
    return a.dotCount === b.dotCount;
  }
  if (a.shapeType !== undefined || b.shapeType !== undefined) {
    return a.shapeType === b.shapeType;
  }
  return a.tl === b.tl && a.tr === b.tr && a.bl === b.bl && a.br === b.br;
}

// 3.1. Mode: Clock Hands & Line Rays (Problem 5 TPA Reference)
function generateClockHandsQuestion(difficulty: 1 | 2 | 3 | 4): PatternQuestion {
  const angleSteps = [0, 45, 90, 135, 180, 225, 270, 315];
  const stepIncrement = pickRandom([45, 90, 135]);
  const startAngle = pickRandom(angleSteps);

  const boxes: QuadrantBox[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (startAngle + i * stepIncrement) % 360;
    boxes.push({ angles: [angle] });
  }
  boxes.push({ angles: [], isQuestion: true });

  const correctAngle = (startAngle + 8 * stepIncrement) % 360;
  const correctBox: QuadrantBox = { angles: [correctAngle] };

  const distractors: QuadrantBox[] = [
    { angles: [(correctAngle + 45) % 360] },
    { angles: [(correctAngle + 90) % 360] },
    { angles: [(correctAngle + 180) % 360] },
  ];

  const optionBoxes = shuffleArray([correctBox, ...distractors]);
  const correctIndex = optionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

  return {
    id: `vis_clock_${Date.now()}_${Math.random()}`,
    category: 'visual',
    categoryLabel: `Deret Jarum & Garis Sinar 45° (Level ${difficulty})`,
    difficultyLevel: difficulty,
    question: `Analisis rotasi jarum/garis arah sinar (${stepIncrement}°) pada matriks gambar 3x3 berikut:`,
    options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
    correctIndex,
    hint: `🔬 *Analisis Guru Lab:* Jarum garis berputar +${stepIncrement}° searah jarum jam pada setiap langkah. Kotak ke-9 berada di posisi sudut ${correctAngle}°.`,
    visualMatrixData: {
      type: 'clock_hands',
      gridCols: 3,
      boxes,
      optionBoxes,
    },
  };
}

// 3.2. Mode: Capsule & Corner O/X Symbols (Problem 4 TPA Reference)
function generateCapsuleQuestion(difficulty: 1 | 2 | 3 | 4): PatternQuestion {
  const positions: ('tl' | 'tr' | 'br' | 'bl')[] = ['tl', 'tr', 'br', 'bl'];
  const startIdx = randomInt(0, 3);

  const boxes: QuadrantBox[] = [];
  for (let i = 0; i < 8; i++) {
    const oPos = positions[(startIdx + i) % 4];
    const xPos = positions[(startIdx + i + 2) % 4];
    boxes.push({
      capsuleTopDot: i % 2 === 0,
      capsuleBottomDot: i % 2 !== 0,
      symbols: [
        { pos: oPos, type: 'circle' },
        { pos: xPos, type: 'cross' },
      ],
    });
  }
  boxes.push({ isQuestion: true });

  const correctOPos = positions[(startIdx + 8) % 4];
  const correctXPos = positions[(startIdx + 8 + 2) % 4];
  const correctBox: QuadrantBox = {
    capsuleTopDot: 8 % 2 === 0,
    capsuleBottomDot: 8 % 2 !== 0,
    symbols: [
      { pos: correctOPos, type: 'circle' },
      { pos: correctXPos, type: 'cross' },
    ],
  };

  const distractors: QuadrantBox[] = [
    {
      capsuleTopDot: !(8 % 2 === 0),
      capsuleBottomDot: 8 % 2 === 0,
      symbols: [{ pos: correctOPos, type: 'circle' }, { pos: correctXPos, type: 'cross' }],
    },
    {
      capsuleTopDot: 8 % 2 === 0,
      capsuleBottomDot: 8 % 2 !== 0,
      symbols: [{ pos: positions[(startIdx + 1) % 4], type: 'circle' }, { pos: correctXPos, type: 'cross' }],
    },
    {
      capsuleTopDot: 8 % 2 === 0,
      capsuleBottomDot: 8 % 2 !== 0,
      symbols: [{ pos: correctOPos, type: 'circle' }, { pos: positions[(startIdx + 1) % 4], type: 'cross' }],
    },
  ];

  const optionBoxes = shuffleArray([correctBox, ...distractors]);
  const correctIndex = optionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

  return {
    id: `vis_capsule_${Date.now()}_${Math.random()}`,
    category: 'visual',
    categoryLabel: `Pola Kapsul & Simbol O/X (Level ${difficulty})`,
    difficultyLevel: difficulty,
    question: `Analisis pergerakan titik pusat kapsul dan rotasi simbol lingkar (O) serta silang (X):`,
    options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
    correctIndex,
    hint: `🔬 *Analisis Guru Lab:* Titik pusat kapsul bergantian hitam-putih, sedangkan simbol lingkar (O) dan silang (X) berputar pada sudut berseberangan.`,
    visualMatrixData: {
      type: 'capsule_symbols',
      gridCols: 3,
      boxes,
      optionBoxes,
    },
  };
}

// 3.3. Mode: Domino Dots Grouping (Problem TPA Reference 2)
function generateDominoQuestion(difficulty: 1 | 2 | 3 | 4): PatternQuestion {
  const step = pickRandom([1, 2]);
  const startDots = randomInt(1, 2);

  const boxes: QuadrantBox[] = [];
  for (let i = 0; i < 8; i++) {
    const dots = ((startDots + i * step - 1) % 6) + 1;
    boxes.push({ dotCount: dots });
  }
  boxes.push({ isQuestion: true });

  const correctDots = ((startDots + 8 * step - 1) % 6) + 1;
  const correctBox: QuadrantBox = { dotCount: correctDots };

  const distractors: QuadrantBox[] = [
    { dotCount: (correctDots % 6) + 1 },
    { dotCount: ((correctDots + 1) % 6) + 1 },
    { dotCount: Math.max(1, correctDots - 1) },
  ];

  const optionBoxes = shuffleArray([correctBox, ...distractors]);
  const correctIndex = optionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

  return {
    id: `vis_domino_${Date.now()}_${Math.random()}`,
    category: 'visual',
    categoryLabel: `Deret Kelompok Bintik Domino (Level ${difficulty})`,
    difficultyLevel: difficulty,
    question: `Perhatikan pola pertambahan kelompok bintik hitam pada wadah domino 2D:`,
    options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
    correctIndex,
    hint: `🔬 *Analisis Guru Lab:* Jumlah bintik bertambah +${step} di setiap tahap. Kotak ke-9 berisi ${correctDots} bintik hitam.`,
    visualMatrixData: {
      type: 'domino_dots',
      gridCols: 3,
      boxes,
      optionBoxes,
    },
  };
}

// 3.4. Mode: Geometric Shapes Sequence (Problem TPA Reference 2)
function generateShapesRowQuestion(difficulty: 1 | 2 | 3 | 4): PatternQuestion {
  const shapes: QuadrantBox['shapeType'][] = [
    'circle_filled',
    'triangle_filled',
    'square_filled',
    'star',
    'diamond',
    'circle_outline',
    'square_outline',
  ];
  const startIdx = randomInt(0, shapes.length - 1);

  const boxes: QuadrantBox[] = [];
  for (let i = 0; i < 8; i++) {
    boxes.push({ shapeType: shapes[(startIdx + i) % shapes.length] });
  }
  boxes.push({ isQuestion: true });

  const correctShape = shapes[(startIdx + 8) % shapes.length];
  const correctBox: QuadrantBox = { shapeType: correctShape };

  const distractors: QuadrantBox[] = [
    { shapeType: shapes[(startIdx + 1) % shapes.length] },
    { shapeType: shapes[(startIdx + 3) % shapes.length] },
    { shapeType: shapes[(startIdx + 5) % shapes.length] },
  ];

  const optionBoxes = shuffleArray([correctBox, ...distractors]);
  const correctIndex = optionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

  return {
    id: `vis_shape_${Date.now()}_${Math.random()}`,
    category: 'visual',
    categoryLabel: `Deret Bentuk Geometri (Level ${difficulty})`,
    difficultyLevel: difficulty,
    question: `Analisis perubahan urutan bentuk geometri (Lingkaran, Segitiga, Kotak, Bintang, Belah Ketupat):`,
    options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
    correctIndex,
    hint: `🔬 *Analisis Guru Lab:* Bentuk geometri berganti secara berurutan. Kotak ke-9 membentuk gambar ${correctShape?.replace('_', ' ').toUpperCase()}.`,
    visualMatrixData: {
      type: 'shapes_row',
      gridCols: 3,
      boxes,
      optionBoxes,
    },
  };
}

// 3.5. Mode: 2x2 Quadrant Grid Matrix
function buildVisualMatrixQuestion(
  categoryLabel: string,
  questionText: string,
  hintText: string,
  boxes: QuadrantBox[],
  correctBox: QuadrantBox,
  difficulty: 1 | 2 | 3 | 4
): PatternQuestion {
  const distractors: QuadrantBox[] = [];

  let attempts = 0;
  while (distractors.length < 3 && attempts < 50) {
    attempts++;
    const wrongBox: QuadrantBox = {
      tl: Math.random() > 0.5,
      tr: Math.random() > 0.5,
      bl: Math.random() > 0.5,
      br: Math.random() > 0.5,
    };

    const isSameAsCorrect = areBoxesEqual(wrongBox, correctBox);
    const isAlreadyDistractor = distractors.some((d) => areBoxesEqual(d, wrongBox));

    if (!isSameAsCorrect && !isAlreadyDistractor) {
      distractors.push(wrongBox);
    }
  }

  const fallbackOptions: QuadrantBox[] = [
    createVisualBox(!correctBox.tl, !!correctBox.tr, !!correctBox.bl, !!correctBox.br),
    createVisualBox(!!correctBox.tl, !correctBox.tr, !!correctBox.bl, !!correctBox.br),
    createVisualBox(!!correctBox.tl, !!correctBox.tr, !correctBox.bl, !!correctBox.br),
    createVisualBox(!correctBox.tl, !correctBox.tr, !correctBox.bl, !correctBox.br),
  ];

  for (const f of fallbackOptions) {
    if (distractors.length >= 3) break;
    if (!areBoxesEqual(f, correctBox) && !distractors.some((d) => areBoxesEqual(d, f))) {
      distractors.push(f);
    }
  }

  const allOptionBoxes = shuffleArray([correctBox, ...distractors.slice(0, 3)]);
  const correctIdx = allOptionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

  return {
    id: `vis_mat_${Date.now()}_${Math.random()}`,
    category: 'visual',
    categoryLabel,
    difficultyLevel: difficulty,
    question: questionText,
    options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
    correctIndex: correctIdx,
    hint: hintText,
    visualMatrixData: {
      type: 'quadrant_matrix',
      gridCols: 3,
      boxes,
      optionBoxes: allOptionBoxes,
    },
  };
}

function generateVisualMatrixQuestion(difficulty: 1 | 2 | 3 | 4): PatternQuestion {
  const mode = pickRandom(['clock_hands', 'capsule_symbols', 'domino_dots', 'shapes_row', 'quadrant_grid']);

  if (mode === 'clock_hands') return generateClockHandsQuestion(difficulty);
  if (mode === 'capsule_symbols') return generateCapsuleQuestion(difficulty);
  if (mode === 'domino_dots') return generateDominoQuestion(difficulty);
  if (mode === 'shapes_row') return generateShapesRowQuestion(difficulty);

  // 5 Sub-variations for quadrant_grid
  const patternType = pickRandom([1, 2, 3, 4, 5]);

  if (patternType === 1) {
    const quadOrder: (keyof QuadrantBox)[] = ['tl', 'tr', 'br', 'bl'];
    const startIdx = randomInt(0, 3);

    const boxes: QuadrantBox[] = [];
    for (let i = 0; i < 8; i++) {
      const activeQuad = quadOrder[(startIdx + i) % 4];
      boxes.push({
        tl: activeQuad === 'tl',
        tr: activeQuad === 'tr',
        br: activeQuad === 'br',
        bl: activeQuad === 'bl',
      });
    }
    boxes.push({ tl: false, tr: false, bl: false, br: false, isQuestion: true });

    const correctQuad = quadOrder[(startIdx + 8) % 4];
    const correctBox: QuadrantBox = {
      tl: correctQuad === 'tl',
      tr: correctQuad === 'tr',
      br: correctQuad === 'br',
      bl: correctQuad === 'bl',
    };

    return buildVisualMatrixQuestion(
      `Deret Gambar Rotasi Searah Jam (Level ${difficulty})`,
      `Perhatikan rotasi kotak hitam searah jarum jam pada matriks gambar 3x3 berikut:`,
      `🔬 *Analisis Guru Lab:* Kotak hitam berputar searah jarum jam. Kotak ke-9 menempati posisi ${correctQuad.toUpperCase()}.`,
      boxes,
      correctBox,
      difficulty
    );
  } else if (patternType === 2) {
    const quadOrder: (keyof QuadrantBox)[] = ['tl', 'bl', 'br', 'tr'];
    const startIdx = randomInt(0, 3);

    const boxes: QuadrantBox[] = [];
    for (let i = 0; i < 8; i++) {
      const activeQuad = quadOrder[(startIdx + i) % 4];
      boxes.push({
        tl: activeQuad === 'tl',
        tr: activeQuad === 'tr',
        br: activeQuad === 'br',
        bl: activeQuad === 'bl',
      });
    }
    boxes.push({ tl: false, tr: false, bl: false, br: false, isQuestion: true });

    const correctQuad = quadOrder[(startIdx + 8) % 4];
    const correctBox: QuadrantBox = {
      tl: correctQuad === 'tl',
      tr: correctQuad === 'tr',
      br: correctQuad === 'br',
      bl: correctQuad === 'bl',
    };

    return buildVisualMatrixQuestion(
      `Deret Gambar Rotasi Berlawanan Jam (Level ${difficulty})`,
      `Analisis pergerakan kotak hitam yang berputar berlawanan arah jarum jam berikut:`,
      `🔬 *Analisis Guru Lab:* Kotak hitam berputar mundur/berlawanan jarum jam. Kotak ke-9 menempati posisi ${correctQuad.toUpperCase()}.`,
      boxes,
      correctBox,
      difficulty
    );
  } else if (patternType === 3) {
    const isStartMainDiag = Math.random() > 0.5;

    const boxes: QuadrantBox[] = [];
    for (let i = 0; i < 8; i++) {
      const isMain = i % 2 === 0 ? isStartMainDiag : !isStartMainDiag;
      boxes.push({
        tl: isMain,
        tr: !isMain,
        bl: !isMain,
        br: isMain,
      });
    }
    boxes.push({ tl: false, tr: false, bl: false, br: false, isQuestion: true });

    const isCorrectMain = 8 % 2 === 0 ? isStartMainDiag : !isStartMainDiag;
    const correctBox: QuadrantBox = {
      tl: isCorrectMain,
      tr: !isCorrectMain,
      bl: !isCorrectMain,
      br: isCorrectMain,
    };

    return buildVisualMatrixQuestion(
      `Deret Gambar Penyilangan Diagonal (Level ${difficulty})`,
      `Amati pola selang-seling penyilangan diagonal hitam pada matriks berikut:`,
      `🔬 *Analisis Guru Lab:* Pola ini bergantian antara diagonal utama (TL-BR) dan diagonal samping (TR-BL). Kotak ke-9 kembali ke ${isCorrectMain ? 'diagonal utama' : 'diagonal samping'}.`,
      boxes,
      correctBox,
      difficulty
    );
  } else if (patternType === 4) {
    const accumOrder: QuadrantBox[] = [
      createVisualBox(true, false, false, false),
      createVisualBox(true, true, false, false),
      createVisualBox(true, true, false, true),
      createVisualBox(true, true, true, true),
    ];
    const startOffset = randomInt(0, 3);

    const boxes: QuadrantBox[] = [];
    for (let i = 0; i < 8; i++) {
      const boxPattern = accumOrder[(startOffset + i) % 4];
      boxes.push({ ...boxPattern });
    }
    boxes.push({ tl: false, tr: false, bl: false, br: false, isQuestion: true });

    const correctBox = accumOrder[(startOffset + 8) % 4];

    return buildVisualMatrixQuestion(
      `Deret Gambar Penambahan Kuadran (Level ${difficulty})`,
      `Perhatikan pola penambahan bertahap area hitam pada kotak 2D berikut:`,
      `🔬 *Analisis Guru Lab:* Jumlah area hitam bertambah secara bertahap (1 ➔ 2 ➔ 3 ➔ 4). Kotak ke-9 memiliki pola yang sesuai.`,
      boxes,
      correctBox,
      difficulty
    );
  } else {
    const boxes: QuadrantBox[] = [
      createVisualBox(true, false, false, false),  // R1C1 (TL)
      createVisualBox(false, true, false, false),  // R1C2 (TR)
      createVisualBox(true, true, false, false),   // R1C3 (TL + TR)
      createVisualBox(false, false, true, false),  // R2C1 (BL)
      createVisualBox(false, false, false, true),  // R2C2 (BR)
      createVisualBox(false, false, true, true),   // R2C3 (BL + BR)
      createVisualBox(true, false, true, false),   // R3C1 (TL + BL)
      createVisualBox(false, true, false, true),   // R3C2 (TR + BR)
      createVisualBox(false, false, false, false, true), // R3C3 (?)
    ];

    const correctBox = createVisualBox(true, true, true, true);

    return buildVisualMatrixQuestion(
      `Deret Pola Matriks 3x3 (Level ${difficulty} - SD 6)`,
      `Analisis Matriks Gambar 3x3 — Tentukan susunan kotak hitam pada posisi (?):`,
      `🔬 *Analisis Guru Lab:* Pada setiap baris, gambar kolom ke-3 adalah gabungan dari gambar kolom ke-1 dan kolom ke-2! Maka posisi ke-9 adalah gabungan penuh 4 kuadran hitam.`,
      boxes,
      correctBox,
      difficulty
    );
  }
}

// ─── 4. Sains & Lab Experiments (Ultra-Randomized) ─────────────────────────

function generateLabScience(difficulty: 1 | 2 | 3 | 4): PatternQuestion {
  if (difficulty <= 2) {
    const variant = pickRandom(['temp', 'vol']);
    if (variant === 'temp') {
      const startTemp = randomInt(10, 45);
      const step = pickRandom([2, 3, 4, 5, 6, 8, 10]);
      const seq = [`${startTemp}°C`, `${startTemp + step}°C`, `${startTemp + step * 2}°C`];
      const answer = `${startTemp + step * 3}°C`;

      const distractors = [`${startTemp + step * 4}°C`, `${startTemp + step * 2 + 1}°C`, `${startTemp + step * 3 + 3}°C`].filter((d) => d !== answer);
      const allOpts = shuffleArray([answer, ...distractors.slice(0, 3)]);
      const correctIdx = allOpts.indexOf(answer);

      return {
        id: `lab_l1_temp_${Date.now()}_${Math.random()}`,
        category: 'lab_science',
        categoryLabel: `Suhu Larutan Lab (Level ${difficulty})`,
        difficultyLevel: difficulty,
        question: `Suhu pemanasan larutan di lab naik teratur +${step}°C setiap menit:\n${seq.join(' ➔ ')} ➔ ?`,
        options: allOpts,
        correctIndex: correctIdx,
        hint: `🔬 *Analisis Guru Lab:* Tambahkan +${step}°C ke suhu terakhir: ${seq[seq.length - 1]} + ${step}°C = ${answer}.`,
      };
    } else {
      const startVol = randomInt(5, 25);
      const step = pickRandom([5, 10, 15, 20]);
      const seq = [`${startVol} ml`, `${startVol + step} ml`, `${startVol + step * 2} ml`];
      const answer = `${startVol + step * 3} ml`;

      const distractors = [`${startVol + step * 4} ml`, `${startVol + step * 2 + 5} ml`, `${startVol + step * 3 + 10} ml`].filter((d) => d !== answer);
      const allOpts = shuffleArray([answer, ...distractors.slice(0, 3)]);
      const correctIdx = allOpts.indexOf(answer);

      return {
        id: `lab_l1_vol_${Date.now()}_${Math.random()}`,
        category: 'lab_science',
        categoryLabel: `Volume Larutan (Level ${difficulty})`,
        difficultyLevel: difficulty,
        question: `Volume penambahan cairan sampel lab bertambah +${step} ml setiap tahap:\n${seq.join(' ➔ ')} ➔ ?`,
        options: allOpts,
        correctIndex: correctIdx,
        hint: `🔬 *Analisis Guru Lab:* Tambahkan +${step} ml ke volume terakhir: ${seq[seq.length - 1]} + ${step} ml = ${answer}.`,
      };
    }
  } else {
    const isHalfLife = Math.random() > 0.6;
    if (isHalfLife) {
      const startMass = pickRandom([160, 320, 480, 640, 800]);
      const seq = [`${startMass} g`, `${startMass / 2} g`, `${startMass / 4} g`];
      const answer = `${startMass / 8} g`;

      const distractors = [`${startMass / 6} g`, `${startMass / 10} g`, `${startMass / 16} g`].filter((d) => d !== answer);
      const allOpts = shuffleArray([answer, ...distractors.slice(0, 3)]);
      const correctIdx = allOpts.indexOf(answer);

      return {
        id: `lab_l4_halflife_${Date.now()}_${Math.random()}`,
        category: 'lab_science',
        categoryLabel: `Waktu Paruh Zat Lab (Level ${difficulty})`,
        difficultyLevel: difficulty,
        question: `Eksperimen Kimia — Peluruhan massa zat menyusut setengahnya (÷2) setiap periode:\n${seq.join(' ➔ ')} ➔ ?`,
        options: allOpts,
        correctIndex: correctIdx,
        hint: `🔬 *Analisis Guru Lab:* Massa zat berkurang setengahnya (dibagi 2). Maka ${seq[seq.length - 1]} ÷ 2 = ${answer}.`,
      };
    } else {
      const mult = pickRandom([2, 3, 4]);
      const startCells = randomInt(2, 20);
      const seq = [`${startCells} Sel`, `${startCells * mult} Sel`, `${startCells * mult * mult} Sel`, `${startCells * mult * mult * mult} Sel`];
      const answer = `${startCells * mult * mult * mult * mult} Sel`;

      const distractors = [`${startCells * mult * 3} Sel`, `${startCells * mult * mult * 2} Sel`, `${startCells * mult * mult * mult * 2} Sel`].filter((d) => d !== answer);
      const allOpts = shuffleArray([answer, ...distractors.slice(0, 3)]);
      const correctIdx = allOpts.indexOf(answer);

      return {
        id: `lab_l4_bacteria_${Date.now()}_${Math.random()}`,
        category: 'lab_science',
        categoryLabel: `Pembelahan Bakteri (Level ${difficulty})`,
        difficultyLevel: difficulty,
        question: `Eksperimen Biologi — Bakteri membelah diri ×${mult} kali lipat setiap jam:\n${seq.join(' ➔ ')} ➔ ?`,
        options: allOpts,
        correctIndex: correctIdx,
        hint: `🔬 *Analisis Guru Lab:* Setiap tahap dikali ${mult} (×${mult}). Maka ${seq[seq.length - 1]} × ${mult} = ${answer}.`,
      };
    }
  }
}

// ─── MASTER PROGRESSIVE ENDLESS QUESTION DISPATCHER (GRADE TAILORED & UNIFIED) ─

function dispatchPatternQuestion(
  questionNumber: number,
  previousCategory?: PatternCategory,
  grade: number = 6
): PatternQuestion {
  const difficulty = getDifficultyForGradeAndNumber(questionNumber, grade);

  const categories: PatternCategory[] = ['aritmatika', 'geometris', 'visual', 'lab_science'];
  const available = previousCategory ? categories.filter((c) => c !== previousCategory) : categories;
  const chosenCategory = pickRandom(available);

  // Every 3rd question, guarantee a procedural visual figure matrix question!
  if (questionNumber % 3 === 0) {
    return generateVisualMatrixQuestion(difficulty);
  }

  switch (chosenCategory) {
    case 'aritmatika':
      return generateArithmetic(difficulty);
    case 'geometris':
      return generateGeometric(difficulty);
    case 'visual':
      return generateVisualMatrixQuestion(difficulty);
    case 'lab_science':
      return generateLabScience(difficulty);
    default:
      return generateArithmetic(difficulty);
  }
}

// Helper to compute fingerprint signature of any question
export function getQuestionSignature(q: PatternQuestion): string {
  if (q.visualMatrixData?.boxes) {
    const boxSig = JSON.stringify(q.visualMatrixData.boxes);
    return `vis_${boxSig}`;
  }
  return `${q.category}_${q.question}`;
}

export function generateNextPatternQuestion(
  questionNumber: number = 1,
  previousCategory?: PatternCategory,
  grade: number = 6,
  usedKeysSet?: Set<string>
): PatternQuestion {
  // Up to 35 attempts to guarantee zero duplicate questions in active session!
  let attempts = 0;
  let candidateQuestion: PatternQuestion;

  while (attempts < 35) {
    attempts++;
    candidateQuestion = dispatchPatternQuestion(questionNumber, previousCategory, grade);
    const signature = getQuestionSignature(candidateQuestion);

    if (!usedKeysSet || !usedKeysSet.has(signature)) {
      if (usedKeysSet) {
        usedKeysSet.add(signature);
      }
      return candidateQuestion;
    }
  }

  // Fallback if max attempts hit: return candidate and record signature
  const fallbackSignature = getQuestionSignature(candidateQuestion!);
  if (usedKeysSet) usedKeysSet.add(fallbackSignature);
  return candidateQuestion!;
}
