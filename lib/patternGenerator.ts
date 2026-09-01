/**
 * patternGenerator.ts
 * Procedural Question Generator for "Detektif Pola" (Pattern & Sequence Predictor)
 * Features strict grade-based difficulty scaling (Kelas 1 to Kelas 6 SD),
 * dynamic random variations, and 2D visual matrix grid patterns.
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

// ─── 1. Aritmatika & Bertingkat (Progressive & Procedurally Randomized) ───

function generateArithmetic(difficulty: 1 | 2 | 3 | 4): PatternQuestion {
  if (difficulty === 1) {
    // Level 1: Super Easy Constant Addition (+1, +2, +3, +4, +5) or Subtraction (-1, -2)
    const isSub = Math.random() > 0.5;
    if (isSub) {
      const step = pickRandom([1, 2]);
      const start = randomInt(10, 20);
      const seq = [start, start - step, start - step * 2, start - step * 3];
      const answer = start - step * 4;
      const distractors = [answer + step + 1, answer - 1, answer + 2];
      const allOpts = shuffleArray([answer.toString(), ...distractors.map((d) => d.toString())]);
      const correctIdx = allOpts.indexOf(answer.toString());

      return {
        id: `arit_l1_${Date.now()}_${Math.random()}`,
        category: 'aritmatika',
        categoryLabel: 'Aritmatika Dasar (Level 1)',
        difficultyLevel: 1,
        question: `Detektif cilik, tentukan angka berikutnya yang berkurang -${step} ini:\n${seq.join(', ')}, ?`,
        options: allOpts,
        correctIndex: correctIdx,
        hint: `🔬 *Analisis Guru Lab:* Setiap langkah selalu berkurang -${step}. Jadi ${seq[seq.length - 1]} - ${step} = ${answer}.`,
      };
    } else {
      const step = pickRandom([1, 2, 3, 4, 5]);
      const start = randomInt(1, 15);
      const seq = [start, start + step, start + step * 2, start + step * 3];
      const answer = start + step * 4;

      const distractors = [answer + step, answer - 1, answer + 2];
      const allOpts = shuffleArray([answer.toString(), ...distractors.map((d) => d.toString())]);
      const correctIdx = allOpts.indexOf(answer.toString());

      return {
        id: `arit_l1_${Date.now()}_${Math.random()}`,
        category: 'aritmatika',
        categoryLabel: 'Aritmatika Dasar (Level 1)',
        difficultyLevel: 1,
        question: `Detektif cilik, tentukan angka berikutnya dari pola bertambah +${step} ini:\n${seq.join(', ')}, ?`,
        options: allOpts,
        correctIndex: correctIdx,
        hint: `🔬 *Analisis Guru Lab:* Setiap langkah selalu bertambah +${step}. Jadi ${seq[seq.length - 1]} + ${step} = ${answer}.`,
      };
    }
  } else if (difficulty === 2) {
    // Level 2: Increasing Step (+2, +3, +4, +5) or (+1, +3, +5, +7)
    const mode = pickRandom(['step_inc', 'odd_step']);
    if (mode === 'step_inc') {
      const start = randomInt(1, 10);
      const seq = [start, start + 2, start + 5, start + 9]; // steps: +2, +3, +4
      const answer = start + 14; // step: +5

      const distractors = [answer + 1, answer - 1, answer + 4];
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
        hint: `🔬 *Analisis Guru Lab:* Selisihnya terus bertambah: +2, +3, +4... Langkah berikutnya bertambah +5, jadi ${seq[seq.length - 1]} + 5 = ${answer}.`,
      };
    } else {
      const start = randomInt(1, 8);
      const seq = [start, start + 1, start + 4, start + 9]; // steps: +1, +3, +5
      const answer = start + 16; // step: +7

      const distractors = [answer + 2, answer - 2, answer + 5];
      const allOpts = shuffleArray([answer.toString(), ...distractors.map((d) => d.toString())]);
      const correctIdx = allOpts.indexOf(answer.toString());

      return {
        id: `arit_l2_odd_${Date.now()}_${Math.random()}`,
        category: 'aritmatika',
        categoryLabel: 'Pola Beda Ganjil (Level 2)',
        difficultyLevel: 2,
        question: `Temukan angka selanjutnya dari pola bertambah ganjil (+1, +3, +5...) ini:\n${seq.join(', ')}, ?`,
        options: allOpts,
        correctIndex: correctIdx,
        hint: `🔬 *Analisis Guru Lab:* Tambahan angka bertambah ganjil: +1, +3, +5, lalu +7. Maka ${seq[seq.length - 1]} + 7 = ${answer}.`,
      };
    }
  } else if (difficulty === 3) {
    // Level 3: Alternating +/- (+5, -2, +5, -2) or Multiply-Then-Subtract
    const addVal = randomInt(4, 8);
    const subVal = randomInt(1, 3);
    const start = randomInt(10, 30);
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
    const a = randomInt(1, 5);
    const b = randomInt(1, 6);
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

// ─── 2. Geometris & Kuadrat (Progressive & Procedurally Randomized) ───────

function generateGeometric(difficulty: 1 | 2 | 3 | 4): PatternQuestion {
  if (difficulty === 1) {
    // Level 1: Simple Even Numbers (+2) or Simple Multiples of 3 (+3)
    const step = pickRandom([2, 3]);
    const start = randomInt(1, 6) * step;
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
    // Level 2: Multiplication x2 or x3
    const mult = pickRandom([2, 3]);
    const start = randomInt(1, 4);
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
    // Square Numbers (1, 4, 9, 16, 25, 36...) with random offset
    const startN = randomInt(1, 3);
    const seq = [startN ** 2, (startN + 1) ** 2, (startN + 2) ** 2, (startN + 3) ** 2];
    const answer = (startN + 4) ** 2;

    const distractors = [answer + 5, answer - 4, answer + 8];
    const allOpts = shuffleArray([answer.toString(), ...distractors.map((d) => d.toString())]);
    const correctIdx = allOpts.indexOf(answer.toString());

    return {
      id: `geo_l3_${Date.now()}_${Math.random()}`,
      category: 'geometris',
      categoryLabel: 'Pangkat Dua Kuadrat (Level 3)',
      difficultyLevel: 3,
      question: `Temukan pola kuadrat angka berikutnya:\n${seq.join(', ')}, ?`,
      options: allOpts,
      correctIndex: correctIdx,
      hint: `🔬 *Analisis Guru Lab:* Ini adalah deret angka kuadrat (${startN}², ${startN + 1}², ${startN + 2}²...). Angka berikutnya adalah ${startN + 4}² = ${answer}.`,
    };
  } else {
    // Level 4 (Max SD 6): Square Numbers with Offset (+1 or -1 or +2)
    const offset = pickRandom([1, -1, 2]);
    const startN = randomInt(1, 3);
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

// ─── 3. Pola Gambar Visual (Quadrant Box Matrix 3x3 Procedurally Varied) ───

function createVisualBox(tl: boolean, tr: boolean, bl: boolean, br: boolean, isQuestion = false): QuadrantBox {
  return { tl, tr, bl, br, isQuestion };
}

function areBoxesEqual(a: QuadrantBox, b: QuadrantBox): boolean {
  return a.tl === b.tl && a.tr === b.tr && a.bl === b.bl && a.br === b.br;
}

function buildVisualMatrixQuestion(
  categoryLabel: string,
  questionText: string,
  hintText: string,
  boxes: QuadrantBox[],
  correctBox: QuadrantBox,
  difficulty: 1 | 2 | 3 | 4
): PatternQuestion {
  // Generate 3 distinct wrong distractors
  const quadrantPositions: (keyof QuadrantBox)[] = ['tl', 'tr', 'bl', 'br'];
  const distractors: QuadrantBox[] = [];

  // Generate unique wrong option boxes
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

  // Fallback distractors if random attempts didn't yield 3 distinct boxes
  const fallbackOptions: QuadrantBox[] = [
    createVisualBox(!correctBox.tl, correctBox.tr, correctBox.bl, correctBox.br),
    createVisualBox(correctBox.tl, !correctBox.tr, correctBox.bl, correctBox.br),
    createVisualBox(correctBox.tl, correctBox.tr, !correctBox.bl, correctBox.br),
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
  // 5 Distinct Procedural Visual Pattern Variations
  const patternType = pickRandom([1, 2, 3, 4, 5]);

  if (patternType === 1 || (difficulty <= 2 && patternType > 3)) {
    // 1. Clockwise Single Quadrant Rotation (Starting from random position)
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
      `🔬 *Analisis Guru Lab:* Kotak hitam berputar searah jarum jam setiap posisi. Pada kotak ke-9, posisi yang tepat berada di ${correctQuad.toUpperCase()}.`,
      boxes,
      correctBox,
      difficulty
    );
  } else if (patternType === 2) {
    // 2. Counter-Clockwise Single Quadrant Rotation
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
    // 3. Diagonal Alternating Quadrants (TL+BR vs TR+BL)
    const isStartMainDiag = Math.random() > 0.5;

    const boxes: QuadrantBox[] = [];
    for (let i = 0; i < 8; i++) {
      const isMain = (i % 2 === 0) ? isStartMainDiag : !isStartMainDiag;
      boxes.push({
        tl: isMain,
        tr: !isMain,
        bl: !isMain,
        br: isMain,
      });
    }
    boxes.push({ tl: false, tr: false, bl: false, br: false, isQuestion: true });

    const isCorrectMain = (8 % 2 === 0) ? isStartMainDiag : !isStartMainDiag;
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
    // 4. Accumulation Progressive Pattern (1 -> 2 -> 3 -> 4)
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
    // 5. Matrix Row Logic Combination (Level 3-4 SD 5-6 Peak)
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

    const correctBox = createVisualBox(true, true, true, true); // All 4 shaded!

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

// ─── 4. Sains & Lab Experiments (Progressive & Procedurally Randomized) ───

function generateLabScience(difficulty: 1 | 2 | 3 | 4): PatternQuestion {
  if (difficulty <= 2) {
    const startTemp = randomInt(15, 30);
    const step = pickRandom([2, 3, 5]);
    const seq = [`${startTemp}°C`, `${startTemp + step}°C`, `${startTemp + step * 2}°C`];
    const answer = `${startTemp + step * 3}°C`;

    const distractors = [`${startTemp + step * 4}°C`, `${startTemp + step * 2 + 1}°C`, `${startTemp + step * 3 + 3}°C`].filter((d) => d !== answer);
    const allOpts = shuffleArray([answer, ...distractors.slice(0, 3)]);
    const correctIdx = allOpts.indexOf(answer);

    return {
      id: `lab_l1_${Date.now()}_${Math.random()}`,
      category: 'lab_science',
      categoryLabel: `Suhu Lab (Level ${difficulty})`,
      difficultyLevel: difficulty,
      question: `Suhu pemanasan larutan di lab naik teratur +${step}°C setiap menit:\n${seq.join(' ➔ ')} ➔ ?`,
      options: allOpts,
      correctIndex: correctIdx,
      hint: `🔬 *Analisis Guru Lab:* Tambahkan +${step}°C ke suhu terakhir: ${seq[seq.length - 1]} + ${step}°C = ${answer}.`,
    };
  } else {
    // Level 3-4: Bacterial doubling
    const mult = pickRandom([2, 3]);
    const startCells = randomInt(5, 15);
    const seq = [`${startCells} Sel`, `${startCells * mult} Sel`, `${startCells * mult * mult} Sel`, `${startCells * mult * mult * mult} Sel`];
    const answer = `${startCells * mult * mult * mult * mult} Sel`;

    const distractors = [`${startCells * mult * 3} Sel`, `${startCells * mult * mult * 2} Sel`, `${startCells * mult * mult * mult * 2} Sel`].filter((d) => d !== answer);
    const allOpts = shuffleArray([answer, ...distractors.slice(0, 3)]);
    const correctIdx = allOpts.indexOf(answer);

    return {
      id: `lab_l4_${Date.now()}_${Math.random()}`,
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

// ─── MASTER PROGRESSIVE ENDLESS QUESTION DISPATCHER (GRADE TAILORED) ────────

export function generateNextPatternQuestion(
  questionNumber: number = 1,
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
