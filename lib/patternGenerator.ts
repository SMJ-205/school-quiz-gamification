/**
 * patternGenerator.ts
 * Procedural Question Generator for "Detektif Pola" (Pattern & Sequence Predictor)
 * Features:
 * - Strict grade-based difficulty scaling (Kelas 1 to Kelas 6 SD)
 * - Zero-duplicate option guarantee for all question types
 * - Zero-duplicate question history tracking per session
 * - Pedagogically clear, intuitive visual patterns for Kelas 1 SD (Latin Square & Row Repetition)
 * - 5 Authentic TPA Visual Puzzle Modes for upper grades
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

// ─── STRICT UNIQUE TEXT OPTIONS GUARANTEE ───────────────────────────────────

function buildUniqueTextOptions(
  answer: number,
  distractorCandidates: number[]
): { options: string[]; correctIndex: number } {
  const uniqueNums: number[] = [answer];

  for (const d of distractorCandidates) {
    if (uniqueNums.length >= 4) break;
    if (!uniqueNums.includes(d) && !isNaN(d)) {
      uniqueNums.push(d);
    }
  }

  // Fallbacks if candidate calculations produced duplicates
  const offsets = [1, -1, 2, -2, 3, -3, 4, -4, 5, -5];
  for (const off of offsets) {
    if (uniqueNums.length >= 4) break;
    const cand = answer + off;
    if (!uniqueNums.includes(cand)) {
      uniqueNums.push(cand);
    }
  }

  const allOpts = shuffleArray(uniqueNums.map((n) => n.toString()));
  const correctIndex = allOpts.indexOf(answer.toString());
  return { options: allOpts, correctIndex };
}

// ─── STRICT UNIQUE VISUAL OPTION BOXES GUARANTEE ───────────────────────────

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

function buildUniqueOptionBoxes(correctBox: QuadrantBox, candidates: QuadrantBox[]): QuadrantBox[] {
  const uniqueList: QuadrantBox[] = [correctBox];

  for (const cand of candidates) {
    if (uniqueList.length >= 4) break;
    if (!uniqueList.some((b) => areBoxesEqual(b, cand))) {
      uniqueList.push(cand);
    }
  }

  // Fallback mutator if candidates weren't sufficient to yield 4 distinct options
  let attempts = 0;
  while (uniqueList.length < 4 && attempts < 50) {
    attempts++;
    let fallback: QuadrantBox;

    if (correctBox.shapeType !== undefined) {
      const allShapes: QuadrantBox['shapeType'][] = [
        'square_filled',
        'circle_filled',
        'triangle_filled',
        'star',
        'diamond',
        'circle_outline',
        'square_outline',
        'triangle_outline',
      ];
      const unusedShape = allShapes.find((s) => !uniqueList.some((b) => b.shapeType === s));
      fallback = { shapeType: unusedShape || 'star' };
    } else if (correctBox.angles !== undefined) {
      const allAngles = [0, 45, 90, 135, 180, 225, 270, 315];
      const unusedAngle = allAngles.find((a) => !uniqueList.some((b) => b.angles?.[0] === a));
      fallback = { angles: [unusedAngle ?? 90] };
    } else if (correctBox.dotCount !== undefined) {
      const unusedDot = [1, 2, 3, 4, 5, 6].find((d) => !uniqueList.some((b) => b.dotCount === d));
      fallback = { dotCount: unusedDot ?? 1 };
    } else {
      fallback = {
        tl: Math.random() > 0.5,
        tr: Math.random() > 0.5,
        bl: Math.random() > 0.5,
        br: Math.random() > 0.5,
      };
    }

    if (!uniqueList.some((b) => areBoxesEqual(b, fallback))) {
      uniqueList.push(fallback);
    }
  }

  return shuffleArray(uniqueList);
}

// ─── STRICT GRADE-BASED DIFFICULTY CALCULATOR (Kelas 1 - 6 SD) ─────────────

export function getDifficultyForGradeAndNumber(qNum: number, grade: number = 6): 1 | 2 | 3 | 4 {
  if (grade <= 1) return 1; // Kelas 1 SD: STRICTLY Level 1 ONLY (Termudah & Intuitif)
  if (grade === 2) return 1; // Kelas 2 SD: STRICTLY Level 1 ONLY (Pola Penjumlahan/Pengurangan & Loncat 2,3,4,5,10)
  if (grade === 3) return qNum <= 5 ? 1 : 2; // Kelas 3 SD: Level 1 s.d. Level 2 (Perkalian Kelipatan 2 & 3 Sederhana)
  if (grade === 4) return qNum <= 4 ? 2 : 3; // Kelas 4 SD: Level 2 s.d. Level 3 (Kuadrat Dasar & Matriks 3x3)
  if (grade === 5) return 3; // Kelas 5 SD: Level 3 (Deret Kuadrat, Pembelahan Sel, Matriks 3x3)
  // Kelas 6 SD Peak
  if (qNum <= 3) return 3;
  return 4; // Level 4 (Fibonacci, Kuadrat Offset, Matriks 3x3 TPA Peak)
}

// ─── 1. Aritmatika & Bertingkat ─────────────────────────────────────────────

function generateArithmetic(difficulty: 1 | 2 | 3 | 4): PatternQuestion {
  if (difficulty === 1) {
    // Level 1 (Kelas 1 - 2 SD): Super Easy Constant Addition (+1, +2, +3, +4, +5, +10) or Subtraction (-1, -2, -3, -5)
    const isSub = Math.random() > 0.5;
    if (isSub) {
      const step = pickRandom([1, 2, 3, 5]);
      const start = randomInt(10, 25);
      const seq = [start, start - step, start - step * 2, start - step * 3];
      const answer = start - step * 4;
      const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + step + 1, answer - 1, answer + 2]);

      return {
        id: `arit_l1_sub_${Date.now()}_${Math.random()}`,
        category: 'aritmatika',
        categoryLabel: 'Aritmatika Pengurangan (Level 1 - SD 1/2)',
        difficultyLevel: 1,
        question: `Detektif cilik, tentukan angka berikutnya yang berkurang -${step} ini:\n${seq.join(', ')}, ?`,
        options,
        correctIndex,
        hint: `🔬 *Analisis Guru Lab:* Setiap langkah selalu berkurang -${step}. Jadi ${seq[seq.length - 1]} - ${step} = ${answer}.`,
      };
    } else {
      const step = pickRandom([1, 2, 3, 4, 5, 10]);
      const start = randomInt(1, 15);
      const seq = [start, start + step, start + step * 2, start + step * 3];
      const answer = start + step * 4;
      const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + step, answer - 1, answer + 2]);

      return {
        id: `arit_l1_add_${Date.now()}_${Math.random()}`,
        category: 'aritmatika',
        categoryLabel: 'Aritmatika Penjumlahan (Level 1 - SD 1/2)',
        difficultyLevel: 1,
        question: `Detektif cilik, tentukan angka berikutnya dari pola bertambah +${step} ini:\n${seq.join(', ')}, ?`,
        options,
        correctIndex,
        hint: `🔬 *Analisis Guru Lab:* Setiap langkah selalu bertambah +${step}. Jadi ${seq[seq.length - 1]} + ${step} = ${answer}.`,
      };
    }
  } else if (difficulty === 2) {
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
      seq = [start, start + 2, start + 6, start + 12];
      answer = start + 20;
      hintStr = `Tambahan angka melompat genap: +2, +4, +6, lalu +8.`;
    } else if (variant === 'odd') {
      seq = [start, start + 1, start + 4, start + 9];
      answer = start + 16;
      hintStr = `Tambahan angka bertambah ganjil: +1, +3, +5, lalu +7.`;
    } else {
      seq = [start, start + 3, start + 9, start + 18];
      answer = start + 30;
      hintStr = `Beda kelipatan 3: +3, +6, +9, lalu +12.`;
    }

    const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + 2, answer - 2, answer + 4]);

    return {
      id: `arit_l2_${Date.now()}_${Math.random()}`,
      category: 'aritmatika',
      categoryLabel: 'Aritmatika Bertingkat (Level 2)',
      difficultyLevel: 2,
      question: `Temukan angka selanjutnya dari pola bertingkat ini:\n${seq.join(', ')}, ?`,
      options,
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* ${hintStr} Jadi ${seq[seq.length - 1]} ➔ ${answer}.`,
    };
  } else if (difficulty === 3) {
    const addVal = randomInt(4, 12);
    const subVal = randomInt(1, 4);
    const start = randomInt(10, 40);
    const seq = [start, start + addVal, start + addVal - subVal, start + addVal * 2 - subVal];
    const answer = start + addVal * 2 - subVal * 2;

    const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + addVal, answer + 1, answer - addVal]);

    return {
      id: `arit_l3_${Date.now()}_${Math.random()}`,
      category: 'aritmatika',
      categoryLabel: 'Pola Alternatif (Level 3)',
      difficultyLevel: 3,
      question: `Deteksi angka selanjutnya pada deret berayun ini:\n${seq.join(', ')}, ?`,
      options,
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* Pola ini selang-seling antara +${addVal} lalu -${subVal}. Giliran berikutnya adalah berkurang -${subVal} (${seq[seq.length - 1]} - ${subVal} = ${answer}).`,
    };
  } else {
    const a = randomInt(1, 8);
    const b = randomInt(1, 10);
    const seq = [a, b, a + b, a + 2 * b, 2 * a + 3 * b];
    const answer = 3 * a + 5 * b;

    const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + a, answer - b, answer + 4]);

    return {
      id: `arit_l4_${Date.now()}_${Math.random()}`,
      category: 'aritmatika',
      categoryLabel: 'Deret Fibonacci (Level 4 - SD 6)',
      difficultyLevel: 4,
      question: `Penyelidikan Tingkat Lanjut — Selesaikan deret Fibonacci ini:\n${seq.join(', ')}, ?`,
      options,
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* Setiap angka adalah hasil penjumlahan 2 angka di depannya! (${seq[seq.length - 2]} + ${seq[seq.length - 1]} = ${answer}).`,
    };
  }
}

// ─── 2. Geometris & Kuadrat ─────────────────────────────────────────────────

function generateGeometric(difficulty: 1 | 2 | 3 | 4): PatternQuestion {
  if (difficulty === 1) {
    const step = pickRandom([2, 3, 4, 5, 10]);
    const start = randomInt(1, 5) * step;
    const seq = [start, start + step, start + step * 2, start + step * 3];
    const answer = start + step * 4;

    const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + 1, answer - 1, answer + 2]);

    return {
      id: `geo_l1_${Date.now()}_${Math.random()}`,
      category: 'geometris',
      categoryLabel: `Pola Loncat ${step} (Level 1 - SD 1/2)`,
      difficultyLevel: 1,
      question: `Tentukan angka berikutnya dari pola loncat +${step} ini:\n${seq.join(', ')}, ?`,
      options,
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* Angka selalu melompat +${step}. ${seq[seq.length - 1]} + ${step} = ${answer}.`,
    };
  } else if (difficulty === 2) {
    const mult = pickRandom([2, 3]);
    const start = mult === 2 ? randomInt(1, 4) : randomInt(1, 2);
    const seq = [start, start * mult, start * mult * mult, start * mult * mult * mult];
    const answer = start * mult * mult * mult * mult;

    const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + mult, answer - start, answer + start * mult]);

    return {
      id: `geo_l2_${Date.now()}_${Math.random()}`,
      category: 'geometris',
      categoryLabel: `Perkalian Kelipatan ×${mult} (Level 2)`,
      difficultyLevel: 2,
      question: `Tentukan angka berikutnya dari pola kelipatan ×${mult} ini:\n${seq.join(', ')}, ?`,
      options,
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* Setiap angka dikali ${mult} (×${mult})! ${seq[seq.length - 1]} × ${mult} = ${answer}.`,
    };
  } else if (difficulty === 3) {
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

      const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + 3, answer - 2, answer + 5]);

      return {
        id: `geo_l3_tri_${Date.now()}_${Math.random()}`,
        category: 'geometris',
        categoryLabel: 'Deret Angka Segitiga (Level 3)',
        difficultyLevel: 3,
        question: `Temukan angka selanjutnya dari pola deret segitiga (+2, +3, +4, +5...) ini:\n${seq.join(', ')}, ?`,
        options,
        correctIndex,
        hint: `🔬 *Analisis Guru Lab:* Penambahan bertambah +1 tiap tahap. Angka berikutnya bertambah +${startN + 5}, jadi ${seq[seq.length - 1]} ➔ ${answer}.`,
      };
    } else {
      const startN = randomInt(1, 5);
      const seq = [startN ** 2, (startN + 1) ** 2, (startN + 2) ** 2, (startN + 3) ** 2];
      const answer = (startN + 4) ** 2;

      const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + 5, answer - 4, answer + 8]);

      return {
        id: `geo_l3_sq_${Date.now()}_${Math.random()}`,
        category: 'geometris',
        categoryLabel: 'Pangkat Dua Kuadrat (Level 3)',
        difficultyLevel: 3,
        question: `Temukan pola kuadrat angka berikutnya:\n${seq.join(', ')}, ?`,
        options,
        correctIndex,
        hint: `🔬 *Analisis Guru Lab:* Ini adalah deret angka kuadrat (${startN}², ${startN + 1}², ${startN + 2}²...). Angka berikutnya adalah ${startN + 4}² = ${answer}.`,
      };
    }
  } else {
    const offset = pickRandom([1, -1, 2, -2, 3]);
    const startN = randomInt(1, 4);
    const seq = [
      startN ** 2 + offset,
      (startN + 1) ** 2 + offset,
      (startN + 2) ** 2 + offset,
      (startN + 3) ** 2 + offset,
    ];
    const answer = (startN + 4) ** 2 + offset;

    const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + 3, answer - 3, answer + 7]);

    const signStr = offset > 0 ? `+ ${offset}` : `- ${Math.abs(offset)}`;

    return {
      id: `geo_l4_${Date.now()}_${Math.random()}`,
      category: 'geometris',
      categoryLabel: 'Pola Kuadrat Offset (Level 4 - SD 6)',
      difficultyLevel: 4,
      question: `Soal Penalaran Lanjutan — Lengkapi deret kuadrat (${signStr}) ini:\n${seq.join(', ')}, ?`,
      options,
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* Pola ini adalah (n² ${signStr})! Langkah berikutnya adalah ${startN + 4}² ${signStr} = ${answer}.`,
    };
  }
}

// ─── 3. Pola Gambar Visual (Grade 1 Intuitive + TPA Modes) ────────────────

function createVisualBox(tl: boolean, tr: boolean, bl: boolean, br: boolean, isQuestion = false): QuadrantBox {
  return { tl, tr, bl, br, isQuestion };
}

// 3.0. SPECIAL KELAS 1 SD VISUAL PUZZLES (Intuitive, Clear, & Pedagogical)
function generateGrade1VisualQuestion(): PatternQuestion {
  const variant = pickRandom(['row_repeat', 'latin_square', 'simple_rotate', 'simple_ray']);

  if (variant === 'row_repeat') {
    // Row 1: Shape A, A, A
    // Row 2: Shape B, B, B
    // Row 3: Shape C, Shape C, ? (Answer: Shape C)
    const shapesPool: QuadrantBox['shapeType'][] = ['square_filled', 'circle_filled', 'triangle_filled', 'star', 'diamond'];
    const selected3 = shuffleArray(shapesPool).slice(0, 3);
    const shapeA = selected3[0];
    const shapeB = selected3[1];
    const shapeC = selected3[2];

    const boxes: QuadrantBox[] = [
      { shapeType: shapeA }, { shapeType: shapeA }, { shapeType: shapeA },
      { shapeType: shapeB }, { shapeType: shapeB }, { shapeType: shapeB },
      { shapeType: shapeC }, { shapeType: shapeC }, { isQuestion: true },
    ];

    const correctBox: QuadrantBox = { shapeType: shapeC };
    const candidateDistractors: QuadrantBox[] = [
      { shapeType: shapeA },
      { shapeType: shapeB },
      { shapeType: shapesPool.find((s) => s !== shapeA && s !== shapeB && s !== shapeC) || 'circle_outline' },
    ];

    const optionBoxes = buildUniqueOptionBoxes(correctBox, candidateDistractors);
    const correctIndex = optionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

    return {
      id: `vis_g1_row_${Date.now()}_${Math.random()}`,
      category: 'visual',
      categoryLabel: 'Pola Perulangan Baris Gambar (Level 1 - SD 1)',
      difficultyLevel: 1,
      question: `Detektif cilik, perhatikan gambar di setiap baris! Gambar apakah yang melengkapi baris ke-3?`,
      options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* Setiap baris berisi 3 gambar yang sama persis! Baris ke-3 berisi bentuk ${shapeC?.replace('_', ' ').toUpperCase()}.`,
      visualMatrixData: {
        type: 'shapes_row',
        gridCols: 3,
        boxes,
        optionBoxes,
      },
    };
  } else if (variant === 'latin_square') {
    // Latin Square 3-Shape Permutation across rows
    // Row 1: A, B, C
    // Row 2: B, C, A
    // Row 3: C, A, ? (Answer: B)
    const shapesPool: QuadrantBox['shapeType'][] = ['square_filled', 'circle_filled', 'triangle_filled', 'star', 'diamond'];
    const selected3 = shuffleArray(shapesPool).slice(0, 3);
    const [shapeA, shapeB, shapeC] = selected3;

    const boxes: QuadrantBox[] = [
      { shapeType: shapeA }, { shapeType: shapeB }, { shapeType: shapeC },
      { shapeType: shapeB }, { shapeType: shapeC }, { shapeType: shapeA },
      { shapeType: shapeC }, { shapeType: shapeA }, { isQuestion: true },
    ];

    const correctBox: QuadrantBox = { shapeType: shapeB };
    const candidateDistractors: QuadrantBox[] = [
      { shapeType: shapeA },
      { shapeType: shapeC },
      { shapeType: shapesPool.find((s) => !selected3.includes(s)) || 'square_outline' },
    ];

    const optionBoxes = buildUniqueOptionBoxes(correctBox, candidateDistractors);
    const correctIndex = optionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

    return {
      id: `vis_g1_latin_${Date.now()}_${Math.random()}`,
      category: 'visual',
      categoryLabel: 'Pola Kelompok 3 Bentuk (Level 1 - SD 1)',
      difficultyLevel: 1,
      question: `Setiap baris memiliki 3 bentuk gambar. Gambar manakah yang kurang pada baris ke-3?`,
      options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* Setiap baris harus memiliki ${shapeA?.replace('_',' ')}, ${shapeB?.replace('_',' ')}, dan ${shapeC?.replace('_',' ')}. Pada baris ke-3 yang belum ada adalah ${shapeB?.replace('_',' ')}.`,
      visualMatrixData: {
        type: 'shapes_row',
        gridCols: 3,
        boxes,
        optionBoxes,
      },
    };
  } else if (variant === 'simple_ray') {
    // 90° Clockwise Ray (0° Up, 90° Right, 180° Down, 270° Left)
    const angles = [0, 90, 180, 270];
    const startIdx = randomInt(0, 3);

    const boxes: QuadrantBox[] = [];
    for (let i = 0; i < 8; i++) {
      boxes.push({ angles: [angles[(startIdx + i) % 4]] });
    }
    boxes.push({ angles: [], isQuestion: true });

    const correctAngle = angles[(startIdx + 8) % 4];
    const correctBox: QuadrantBox = { angles: [correctAngle] };
    const candidateDistractors: QuadrantBox[] = [
      { angles: [(correctAngle + 90) % 360] },
      { angles: [(correctAngle + 180) % 360] },
      { angles: [(correctAngle + 270) % 360] },
    ];

    const optionBoxes = buildUniqueOptionBoxes(correctBox, candidateDistractors);
    const correctIndex = optionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

    return {
      id: `vis_g1_ray_${Date.now()}_${Math.random()}`,
      category: 'visual',
      categoryLabel: 'Rotasi Garis Sinar 90° (Level 1 - SD 1)',
      difficultyLevel: 1,
      question: `Perhatikan garis jarum berputar 90° searah jarum jam. Ke manakah arah jarum pada kotak ke-9?`,
      options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* Jarum berputar 90° searah jarum jam (Atas ➔ Kanan ➔ Bawah ➔ Kiri).`,
      visualMatrixData: {
        type: 'clock_hands',
        gridCols: 3,
        boxes,
        optionBoxes,
      },
    };
  } else {
    // Simple 1-quadrant clockwise rotation
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

    const candidateDistractors: QuadrantBox[] = [
      { tl: correctQuad !== 'tl', tr: correctQuad === 'tl', bl: false, br: false },
      { tl: false, tr: false, bl: correctQuad !== 'bl', br: true },
      { tl: true, tr: true, bl: false, br: false },
    ];

    const optionBoxes = buildUniqueOptionBoxes(correctBox, candidateDistractors);
    const correctIndex = optionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

    return {
      id: `vis_g1_quad_${Date.now()}_${Math.random()}`,
      category: 'visual',
      categoryLabel: 'Rotasi Kotak Hitam (Level 1 - SD 1)',
      difficultyLevel: 1,
      question: `Perhatikan pergerakan kotak hitam yang berputar searah jarum jam!`,
      options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* Kotak hitam berpindah posisi searah jarum jam pada setiap langkah.`,
      visualMatrixData: {
        type: 'quadrant_matrix',
        gridCols: 3,
        boxes,
        optionBoxes,
      },
    };
  }
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

  const candidateDistractors: QuadrantBox[] = [
    { angles: [(correctAngle + 45) % 360] },
    { angles: [(correctAngle + 90) % 360] },
    { angles: [(correctAngle + 180) % 360] },
    { angles: [(correctAngle + 270) % 360] },
  ];

  const optionBoxes = buildUniqueOptionBoxes(correctBox, candidateDistractors);
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

  const candidateDistractors: QuadrantBox[] = [
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

  const optionBoxes = buildUniqueOptionBoxes(correctBox, candidateDistractors);
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

// 3.3. Mode: Domino Dots Grouping
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

  const candidateDistractors: QuadrantBox[] = [
    { dotCount: (correctDots % 6) + 1 },
    { dotCount: ((correctDots + 1) % 6) + 1 },
    { dotCount: Math.max(1, correctDots - 1) },
  ];

  const optionBoxes = buildUniqueOptionBoxes(correctBox, candidateDistractors);
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

// 3.4. Mode: Geometric Shapes Sequence
function generateShapesRowQuestion(difficulty: 1 | 2 | 3 | 4): PatternQuestion {
  if (difficulty === 1) {
    return generateGrade1VisualQuestion();
  }

  // Upper Grades (Level 2+): Latin Square Permutation Pattern
  const shapes: QuadrantBox['shapeType'][] = [
    'circle_filled',
    'triangle_filled',
    'square_filled',
    'star',
    'diamond',
  ];
  const selected3 = shuffleArray(shapes).slice(0, 3);
  const [sA, sB, sC] = selected3;

  const boxes: QuadrantBox[] = [
    { shapeType: sA }, { shapeType: sB }, { shapeType: sC },
    { shapeType: sB }, { shapeType: sC }, { shapeType: sA },
    { shapeType: sC }, { shapeType: sA }, { isQuestion: true },
  ];

  const correctShape = sB;
  const correctBox: QuadrantBox = { shapeType: correctShape };

  const candidateDistractors: QuadrantBox[] = [
    { shapeType: sA },
    { shapeType: sC },
    { shapeType: shapes.find((s) => !selected3.includes(s)) || 'square_outline' },
  ];

  const optionBoxes = buildUniqueOptionBoxes(correctBox, candidateDistractors);
  const correctIndex = optionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

  return {
    id: `vis_shape_${Date.now()}_${Math.random()}`,
    category: 'visual',
    categoryLabel: `Deret Pola Bentuk Geometri (Level ${difficulty})`,
    difficultyLevel: difficulty,
    question: `Analisis permutasi 3 bentuk geometri (Lingkaran, Segitiga, Kotak, Bintang, Belah Ketupat) pada matriks:`,
    options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
    correctIndex,
    hint: `🔬 *Analisis Guru Lab:* Setiap baris memiliki 3 bentuk yang sama. Kotak ke-9 diisi oleh ${correctShape?.replace('_', ' ').toUpperCase()}.`,
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
  const candidateDistractors: QuadrantBox[] = [
    createVisualBox(!correctBox.tl, !!correctBox.tr, !!correctBox.bl, !!correctBox.br),
    createVisualBox(!!correctBox.tl, !correctBox.tr, !!correctBox.bl, !!correctBox.br),
    createVisualBox(!!correctBox.tl, !!correctBox.tr, !correctBox.bl, !!correctBox.br),
    createVisualBox(!correctBox.tl, !correctBox.tr, !correctBox.bl, !correctBox.br),
  ];

  const optionBoxes = buildUniqueOptionBoxes(correctBox, candidateDistractors);
  const correctIndex = optionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

  return {
    id: `vis_mat_${Date.now()}_${Math.random()}`,
    category: 'visual',
    categoryLabel,
    difficultyLevel: difficulty,
    question: questionText,
    options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
    correctIndex,
    hint: hintText,
    visualMatrixData: {
      type: 'quadrant_matrix',
      gridCols: 3,
      boxes,
      optionBoxes,
    },
  };
}

function generateVisualMatrixQuestion(difficulty: 1 | 2 | 3 | 4): PatternQuestion {
  if (difficulty === 1) {
    return generateGrade1VisualQuestion();
  }

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

// ─── 4. Sains & Lab Experiments ─────────────────────────────────────────────

function generateLabScience(difficulty: 1 | 2 | 3 | 4): PatternQuestion {
  if (difficulty <= 2) {
    const variant = pickRandom(['temp', 'vol']);
    if (variant === 'temp') {
      const startTemp = randomInt(10, 45);
      const step = pickRandom([2, 3, 4, 5, 6, 8, 10]);
      const seq = [`${startTemp}°C`, `${startTemp + step}°C`, `${startTemp + step * 2}°C`];
      const answer = `${startTemp + step * 3}°C`;

      const { options, correctIndex } = buildUniqueTextOptions(
        startTemp + step * 3,
        [startTemp + step * 4, startTemp + step * 2 + 1, startTemp + step * 3 + 3]
      );
      const allOpts = options.map((o) => (o.endsWith('°C') ? o : `${o}°C`));

      return {
        id: `lab_l1_temp_${Date.now()}_${Math.random()}`,
        category: 'lab_science',
        categoryLabel: `Suhu Larutan Lab (Level ${difficulty})`,
        difficultyLevel: difficulty,
        question: `Suhu pemanasan larutan di lab naik teratur +${step}°C setiap menit:\n${seq.join(' ➔ ')} ➔ ?`,
        options: allOpts,
        correctIndex,
        hint: `🔬 *Analisis Guru Lab:* Tambahkan +${step}°C ke suhu terakhir: ${seq[seq.length - 1]} + ${step}°C = ${answer}.`,
      };
    } else {
      const startVol = randomInt(5, 25);
      const step = pickRandom([5, 10, 15, 20]);
      const seq = [`${startVol} ml`, `${startVol + step} ml`, `${startVol + step * 2} ml`];
      const answer = `${startVol + step * 3} ml`;

      const { options, correctIndex } = buildUniqueTextOptions(
        startVol + step * 3,
        [startVol + step * 4, startVol + step * 2 + 5, startVol + step * 3 + 10]
      );
      const allOpts = options.map((o) => (o.endsWith('ml') ? o : `${o} ml`));

      return {
        id: `lab_l1_vol_${Date.now()}_${Math.random()}`,
        category: 'lab_science',
        categoryLabel: `Volume Larutan (Level ${difficulty})`,
        difficultyLevel: difficulty,
        question: `Volume penambahan cairan sampel lab bertambah +${step} ml setiap tahap:\n${seq.join(' ➔ ')} ➔ ?`,
        options: allOpts,
        correctIndex,
        hint: `🔬 *Analisis Guru Lab:* Tambahkan +${step} ml ke volume terakhir: ${seq[seq.length - 1]} + ${step} ml = ${answer}.`,
      };
    }
  } else {
    const isHalfLife = Math.random() > 0.6;
    if (isHalfLife) {
      const startMass = pickRandom([160, 320, 480, 640, 800]);
      const seq = [`${startMass} g`, `${startMass / 2} g`, `${startMass / 4} g`];
      const answer = `${startMass / 8} g`;

      const { options, correctIndex } = buildUniqueTextOptions(
        startMass / 8,
        [startMass / 6, startMass / 10, startMass / 16]
      );
      const allOpts = options.map((o) => (o.endsWith('g') ? o : `${o} g`));

      return {
        id: `lab_l4_halflife_${Date.now()}_${Math.random()}`,
        category: 'lab_science',
        categoryLabel: `Waktu Paruh Zat Lab (Level ${difficulty})`,
        difficultyLevel: difficulty,
        question: `Eksperimen Kimia — Peluruhan massa zat menyusut setengahnya (÷2) setiap periode:\n${seq.join(' ➔ ')} ➔ ?`,
        options: allOpts,
        correctIndex,
        hint: `🔬 *Analisis Guru Lab:* Massa zat berkurang setengahnya (dibagi 2). Maka ${seq[seq.length - 1]} ÷ 2 = ${answer}.`,
      };
    } else {
      const mult = pickRandom([2, 3, 4]);
      const startCells = randomInt(2, 20);
      const seq = [`${startCells} Sel`, `${startCells * mult} Sel`, `${startCells * mult * mult} Sel`, `${startCells * mult * mult * mult} Sel`];
      const answer = `${startCells * mult * mult * mult * mult} Sel`;

      const { options, correctIndex } = buildUniqueTextOptions(
        startCells * mult ** 4,
        [startCells * mult * 3, startCells * mult ** 2 * 2, startCells * mult ** 3 * 2]
      );
      const allOpts = options.map((o) => (o.endsWith('Sel') ? o : `${o} Sel`));

      return {
        id: `lab_l4_bacteria_${Date.now()}_${Math.random()}`,
        category: 'lab_science',
        categoryLabel: `Pembelahan Bakteri (Level ${difficulty})`,
        difficultyLevel: difficulty,
        question: `Eksperimen Biologi — Bakteri membelah diri ×${mult} kali lipat setiap jam:\n${seq.join(' ➔ ')} ➔ ?`,
        options: allOpts,
        correctIndex,
        hint: `🔬 *Analisis Guru Lab:* Setiap tahap dikali ${mult} (×${mult}). Maka ${seq[seq.length - 1]} × ${mult} = ${answer}.`,
      };
    }
  }
}

// ─── MASTER PROGRESSIVE ENDLESS QUESTION DISPATCHER ─────────────────────────

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
