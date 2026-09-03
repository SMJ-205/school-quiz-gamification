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
  difficultyLevel: 1 | 2 | 3 | 4 | 5 | 6; // 1: SD 1-2, 2: SD 3-4, 3: SD 5, 4: Max SD 6
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
  if (a.pentagonData !== undefined || b.pentagonData !== undefined) {
    return JSON.stringify(a.pentagonData) === JSON.stringify(b.pentagonData);
  }
  if (a.pointerCircleData !== undefined || b.pointerCircleData !== undefined) {
    return JSON.stringify(a.pointerCircleData) === JSON.stringify(b.pointerCircleData);
  }
  if (a.ringNotchData !== undefined || b.ringNotchData !== undefined) {
    return JSON.stringify(a.ringNotchData) === JSON.stringify(b.ringNotchData);
  }
  if (a.nestedShapeData !== undefined || b.nestedShapeData !== undefined) {
    return JSON.stringify(a.nestedShapeData) === JSON.stringify(b.nestedShapeData);
  }
  if (a.spiderwebData !== undefined || b.spiderwebData !== undefined) {
    return JSON.stringify(a.spiderwebData) === JSON.stringify(b.spiderwebData);
  }
  if (a.gridOuterDotData !== undefined || b.gridOuterDotData !== undefined) {
    return JSON.stringify(a.gridOuterDotData) === JSON.stringify(b.gridOuterDotData);
  }
  if (a.orbitDotsData !== undefined || b.orbitDotsData !== undefined) {
    return JSON.stringify(a.orbitDotsData) === JSON.stringify(b.orbitDotsData);
  }
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

    if (correctBox.pentagonData !== undefined) {
      const unusedVertex = [0, 1, 2, 3, 4].find(
        (v) => !uniqueList.some((b) => b.pentagonData?.dotVertex === v)
      );
      fallback = {
        pentagonData: {
          arrowAngle: (correctBox.pentagonData.arrowAngle + 90) % 360,
          dotVertex: unusedVertex ?? (correctBox.pentagonData.dotVertex + 1) % 5,
        },
      };
    } else if (correctBox.pointerCircleData !== undefined) {
      const allAngles = [0, 45, 90, 135, 180, 225, 270, 315];
      const unusedAngle = allAngles.find(
        (a) => !uniqueList.some((b) => b.pointerCircleData?.dotPositionAngle === a)
      );
      fallback = {
        pointerCircleData: {
          dotPositionAngle: unusedAngle ?? (correctBox.pointerCircleData.dotPositionAngle + 90) % 360,
        },
      };
    } else if (correctBox.ringNotchData !== undefined) {
      const allAngles = [0, 45, 90, 135, 180, 225, 270, 315];
      const unusedAngle = allAngles.find(
        (a) => !uniqueList.some((b) => b.ringNotchData?.angle === a)
      );
      fallback = {
        ringNotchData: {
          angle: unusedAngle ?? (correctBox.ringNotchData.angle + 90) % 360,
        },
      };
    } else if (correctBox.nestedShapeData !== undefined) {
      const allShapes: ('circle' | 'triangle' | 'square' | 'diamond')[] = [
        'circle',
        'triangle',
        'square',
        'diamond',
      ];
      const unusedInner = allShapes.find(
        (s) => !uniqueList.some((b) => b.nestedShapeData?.innerShape === s)
      );
      fallback = {
        nestedShapeData: {
          outerShape: correctBox.nestedShapeData.outerShape,
          innerShape: unusedInner || 'circle',
          innerFilled: !correctBox.nestedShapeData.innerFilled,
        },
      };
    } else if (correctBox.spiderwebData !== undefined) {
      const unusedBug = [0, 1, 2, 3, 4].find(
        (v) => !uniqueList.some((b) => b.spiderwebData?.bugVertex === v)
      );
      fallback = {
        spiderwebData: {
          lightningBranches: correctBox.spiderwebData.lightningBranches,
          bugVertex: unusedBug ?? (correctBox.spiderwebData.bugVertex + 1) % 5,
        },
      };
    } else if (correctBox.gridOuterDotData !== undefined) {
      const positions: ('tl' | 'tr' | 'br' | 'bl')[] = ['tl', 'tr', 'br', 'bl'];
      const unusedPos = positions.find(
        (p) => !uniqueList.some((b) => b.gridOuterDotData?.outerDotPos === p)
      );
      fallback = {
        gridOuterDotData: {
          ...correctBox.gridOuterDotData,
          outerDotPos: unusedPos || 'tl',
        },
      };
    } else if (correctBox.orbitDotsData !== undefined) {
      fallback = {
        orbitDotsData: {
          centerShape: correctBox.orbitDotsData.centerShape,
          centerFilled: !correctBox.orbitDotsData.centerFilled,
          activeDots: [(correctBox.orbitDotsData.activeDots[0] + 1) % 6],
        },
      };
    } else if (correctBox.shapeType !== undefined) {
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
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type SubLevel = 'easy' | 'mid' | 'hard';

export function getDifficultyForGrade(grade: number = 6): DifficultyLevel {
  const g = Math.round(grade);
  if (g <= 1) return 1;
  if (g === 2) return 2;
  if (g === 3) return 3;
  if (g === 4) return 4;
  if (g === 5) return 5;
  return 6;
}

export function getSubLevelForQuestionNumber(qNum: number): SubLevel {
  if (qNum <= 3) return 'easy';
  if (qNum <= 6) return 'mid';
  return 'hard';
}

export function getDifficultyForGradeAndNumber(qNum: number, grade: number = 6): DifficultyLevel {
  return getDifficultyForGrade(grade);
}

// ─── 1. Aritmatika & Bertingkat ─────────────────────────────────────────────

function generateArithmetic(difficulty: DifficultyLevel, subLevel: SubLevel = 'easy'): PatternQuestion {
  if (difficulty === 1) {
    const isSub = subLevel === 'hard' || (subLevel === 'mid' && Math.random() > 0.5);
    if (isSub) {
      const step = subLevel === 'mid' ? 2 : pickRandom([3, 5]);
      const start = randomInt(10, 25);
      const seq = [start, start - step, start - step * 2, start - step * 3];
      const answer = start - step * 4;
      const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + step + 1, answer - 1, answer + 2]);
      return {
        id: `arit_t1_sub_${Date.now()}_${Math.random()}`,
        category: 'aritmatika',
        categoryLabel: `Aritmatika Pengurangan (Tier 1 - Kelas 1 SD)`,
        difficultyLevel: 1,
        question: `Detektif cilik, tentukan angka berikutnya yang berkurang -${step} ini:\n${seq.join(', ')}, ?`,
        options,
        correctIndex,
        hint: `🔬 *Analisis Guru Lab:* Setiap langkah selalu berkurang -${step}. Jadi ${seq[seq.length - 1]} - ${step} = ${answer}.`,
      };
    } else {
      const step = subLevel === 'easy' ? pickRandom([1, 2]) : subLevel === 'mid' ? pickRandom([2, 3, 5]) : pickRandom([5, 10]);
      const start = randomInt(1, 15);
      const seq = [start, start + step, start + step * 2, start + step * 3];
      const answer = start + step * 4;
      const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + step, answer - 1, answer + 2]);
      return {
        id: `arit_t1_add_${Date.now()}_${Math.random()}`,
        category: 'aritmatika',
        categoryLabel: `Aritmatika Penjumlahan (Tier 1 - Kelas 1 SD)`,
        difficultyLevel: 1,
        question: `Detektif cilik, tentukan angka berikutnya dari pola bertambah +${step} ini:\n${seq.join(', ')}, ?`,
        options,
        correctIndex,
        hint: `🔬 *Analisis Guru Lab:* Setiap langkah selalu bertambah +${step}. Jadi ${seq[seq.length - 1]} + ${step} = ${answer}.`,
      };
    }
  } else if (difficulty === 2) {
    const step = subLevel === 'easy' ? pickRandom([3, 4]) : subLevel === 'mid' ? pickRandom([4, 5, 6]) : pickRandom([6, 7, 8]);
    const start = randomInt(10, 40);
    const seq = [start, start + step, start + step * 2, start + step * 3];
    const answer = start + step * 4;
    const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + step, answer - 2, answer + 3]);
    return {
      id: `arit_t2_${Date.now()}_${Math.random()}`,
      category: 'aritmatika',
      categoryLabel: `Aritmatika Loncat (Tier 2 - Kelas 2 SD)`,
      difficultyLevel: 2,
      question: `Tentukan angka berikutnya dari deret bilangan bertambah +${step} ini:\n${seq.join(', ')}, ?`,
      options,
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* Pola bertambah +${step} secara konstan. Maka ${seq[seq.length - 1]} + ${step} = ${answer}.`,
    };
  } else if (difficulty === 3) {
    const variant = subLevel === 'easy' ? 'inc_1' : subLevel === 'mid' ? 'inc_2' : pickRandom(['odd', 'mult_3']);
    const start = randomInt(1, 20);
    let seq: number[] = [];
    let answer = 0;
    let hintStr = '';
    if (variant === 'inc_1') {
      seq = [start, start + 2, start + 5, start + 9];
      answer = start + 14;
      hintStr = 'Selisihnya bertambah satu (+2, +3, +4, lalu +5).';
    } else if (variant === 'inc_2') {
      seq = [start, start + 2, start + 6, start + 12];
      answer = start + 20;
      hintStr = 'Lompatan genap bertambah: +2, +4, +6, lalu +8.';
    } else if (variant === 'odd') {
      seq = [start, start + 1, start + 4, start + 9];
      answer = start + 16;
      hintStr = 'Lompatan ganjil: +1, +3, +5, lalu +7.';
    } else {
      seq = [start, start + 3, start + 9, start + 18];
      answer = start + 30;
      hintStr = 'Kelipatan 3: +3, +6, +9, lalu +12.';
    }
    const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + 2, answer - 2, answer + 4]);
    return {
      id: `arit_t3_${Date.now()}_${Math.random()}`,
      category: 'aritmatika',
      categoryLabel: `Aritmatika Bertingkat (Tier 3 - Kelas 3 SD)`,
      difficultyLevel: 3,
      question: `Temukan angka selanjutnya dari pola bertingkat ini:\n${seq.join(', ')}, ?`,
      options,
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* ${hintStr} Hasilnya adalah ${answer}.`,
    };
  } else if (difficulty === 4) {
    const addVal = randomInt(5, 12);
    const subVal = randomInt(2, 5);
    const start = randomInt(15, 50);
    const seq = [start, start + addVal, start + addVal - subVal, start + addVal * 2 - subVal];
    const answer = start + addVal * 2 - subVal * 2;
    const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + addVal, answer - subVal, answer + 3]);
    return {
      id: `arit_t4_${Date.now()}_${Math.random()}`,
      category: 'aritmatika',
      categoryLabel: `Pola Bergantian (Tier 4 - Kelas 4 SD)`,
      difficultyLevel: 4,
      question: `Deteksi angka selanjutnya pada deret berayun (+/–) ini:\n${seq.join(', ')}, ?`,
      options,
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* Pola selang-seling (+${addVal}, -${subVal}). Giliran berikutnya berkurang -${subVal} = ${answer}.`,
    };
  } else if (difficulty === 5) {
    const a = randomInt(2, 7);
    const b = randomInt(3, 9);
    const seq = [a, b, a + b, a + 2 * b, 2 * a + 3 * b];
    const answer = 3 * a + 5 * b;
    const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + a, answer - b, answer + 4]);
    return {
      id: `arit_t5_${Date.now()}_${Math.random()}`,
      category: 'aritmatika',
      categoryLabel: `Deret Fibonacci Dasar (Tier 5 - Kelas 5 SD)`,
      difficultyLevel: 5,
      question: `Selesaikan deret Fibonacci dua suku sebelumnya ini:\n${seq.join(', ')}, ?`,
      options,
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* Setiap angka adalah hasil penjumlahan 2 angka di depannya: ${seq[seq.length - 2]} + ${seq[seq.length - 1]} = ${answer}.`,
    };
  } else {
    // Tier 6: Kelas 6 SD Peak
    const isInterleaved = subLevel !== 'easy' && Math.random() > 0.4;
    if (isInterleaved) {
      const aStart = randomInt(2, 6);
      const bStart = randomInt(40, 60);
      const aStep = randomInt(2, 4);
      const bStep = randomInt(3, 5);
      const seq = [aStart, bStart, aStart + aStep, bStart - bStep, aStart + aStep * 2, bStart - bStep * 2];
      const answer = aStart + aStep * 3;
      const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + aStep, answer - 2, answer + 4]);
      return {
        id: `arit_t6_inter_${Date.now()}_${Math.random()}`,
        category: 'aritmatika',
        categoryLabel: `Deret Bersilangan Dua Jalur TPA (Tier 6 - Kelas 6 SD)`,
        difficultyLevel: 6,
        question: `Penyelidikan TPA Lanjutan — Temukan suku berikutnya dari deret dua jalur bersilangan ini:\n${seq.join(', ')}, ?`,
        options,
        correctIndex,
        hint: `🔬 *Analisis Guru Lab:* Deret ini terdiri dari dua jalur berselang-seling! Jalur ganjil bertambah +${aStep}. Maka jawabannya adalah ${answer}.`,
      };
    } else {
      const a = randomInt(3, 10);
      const b = randomInt(5, 12);
      const seq = [a, b, a + b, a + 2 * b, 2 * a + 3 * b];
      const answer = 3 * a + 5 * b;
      const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + a, answer - b, answer + 6]);
      return {
        id: `arit_t6_fibo_${Date.now()}_${Math.random()}`,
        category: 'aritmatika',
        categoryLabel: `Deret Fibonacci TPA Penalaran (Tier 6 - Kelas 6 SD)`,
        difficultyLevel: 6,
        question: `Analisis Deret Penalaran Logika TPA:\n${seq.join(', ')}, ?`,
        options,
        correctIndex,
        hint: `🔬 *Analisis Guru Lab:* Setiap angka adalah penjumlahan dua suku di depannya (${seq[seq.length - 2]} + ${seq[seq.length - 1]} = ${answer}).`,
      };
    }
  }
}

// ─── 2. Geometris & Kuadrat ─────────────────────────────────────────────────

function generateGeometric(difficulty: DifficultyLevel, subLevel: SubLevel = 'easy'): PatternQuestion {
  if (difficulty === 1) {
    const step = subLevel === 'easy' ? 2 : subLevel === 'mid' ? pickRandom([3, 5]) : 10;
    const start = randomInt(1, 4) * step;
    const seq = [start, start + step, start + step * 2, start + step * 3];
    const answer = start + step * 4;
    const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + step, answer - 1, answer + 2]);
    return {
      id: `geo_t1_${Date.now()}_${Math.random()}`,
      category: 'geometris',
      categoryLabel: `Pola Loncat ${step} (Tier 1 - Kelas 1 SD)`,
      difficultyLevel: 1,
      question: `Tentukan angka berikutnya dari pola loncat +${step} ini:\n${seq.join(', ')}, ?`,
      options,
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* Angka selalu melompat +${step}. ${seq[seq.length - 1]} + ${step} = ${answer}.`,
    };
  } else if (difficulty === 2) {
    const mult = subLevel === 'hard' ? 3 : 2;
    const start = mult === 2 ? randomInt(1, 3) : 1;
    const seq = [start, start * mult, start * mult * mult, start * mult * mult * mult];
    const answer = start * Math.pow(mult, 4);
    const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + mult, answer - start, answer + start * mult]);
    return {
      id: `geo_t2_${Date.now()}_${Math.random()}`,
      category: 'geometris',
      categoryLabel: `Perkalian Kelipatan ×${mult} (Tier 2 - Kelas 2 SD)`,
      difficultyLevel: 2,
      question: `Tentukan angka berikutnya dari pola kelipatan ×${mult} ini:\n${seq.join(', ')}, ?`,
      options,
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* Setiap angka dikali ${mult} (×${mult})! Maka ${seq[seq.length - 1]} × ${mult} = ${answer}.`,
    };
  } else if (difficulty === 3) {
    const startN = randomInt(1, 3);
    const seq = [
      (startN * (startN + 1)) / 2,
      ((startN + 1) * (startN + 2)) / 2,
      ((startN + 2) * (startN + 3)) / 2,
      ((startN + 3) * (startN + 4)) / 2,
    ];
    const answer = ((startN + 4) * (startN + 5)) / 2;
    const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + 3, answer - 2, answer + 5]);
    return {
      id: `geo_t3_${Date.now()}_${Math.random()}`,
      category: 'geometris',
      categoryLabel: 'Deret Angka Segitiga (Tier 3 - Kelas 3 SD)',
      difficultyLevel: 3,
      question: `Temukan angka selanjutnya dari pola deret segitiga (+2, +3, +4...) ini:\n${seq.join(', ')}, ?`,
      options,
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* Penambahan bertambah +1 tiap tahap. Suku berikutnya adalah ${answer}.`,
    };
  } else if (difficulty === 4) {
    const startN = randomInt(1, 4);
    const seq = [startN ** 2, (startN + 1) ** 2, (startN + 2) ** 2, (startN + 3) ** 2];
    const answer = (startN + 4) ** 2;
    const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + 5, answer - 4, answer + 8]);
    return {
      id: `geo_t4_${Date.now()}_${Math.random()}`,
      category: 'geometris',
      categoryLabel: 'Pangkat Dua Kuadrat (Tier 4 - Kelas 4 SD)',
      difficultyLevel: 4,
      question: `Temukan pola kuadrat angka berikutnya:\n${seq.join(', ')}, ?`,
      options,
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* Ini adalah deret angka kuadrat (${startN}², ${startN + 1}²...). Angka berikutnya adalah ${startN + 4}² = ${answer}.`,
    };
  } else if (difficulty === 5) {
    const offset = pickRandom([1, -1, 2, -2]);
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
      id: `geo_t5_${Date.now()}_${Math.random()}`,
      category: 'geometris',
      categoryLabel: `Pola Kuadrat Offset (Tier 5 - Kelas 5 SD)`,
      difficultyLevel: 5,
      question: `Lengkapi deret kuadrat (${signStr}) ini:\n${seq.join(', ')}, ?`,
      options,
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* Pola ini adalah (n² ${signStr})! Maka ${startN + 4}² ${signStr} = ${answer}.`,
    };
  } else {
    // Tier 6: Pola Kuadrat Dinamis / Kubik TPA
    const isCubic = subLevel === 'hard';
    if (isCubic) {
      const startN = randomInt(1, 3);
      const seq = [startN ** 3, (startN + 1) ** 3, (startN + 2) ** 3, (startN + 3) ** 3];
      const answer = (startN + 4) ** 3;
      const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + 9, answer - 7, answer + 15]);
      return {
        id: `geo_t6_cube_${Date.now()}_${Math.random()}`,
        category: 'geometris',
        categoryLabel: 'Deret Pangkat Kubik TPA (Tier 6 - Kelas 6 SD)',
        difficultyLevel: 6,
        question: `Penyelidikan TPA Lanjutan — Tentukan suku berikutnya dari deret pangkat tiga ini:\n${seq.join(', ')}, ?`,
        options,
        correctIndex,
        hint: `🔬 *Analisis Guru Lab:* Pola bilangan kubik (n³). Suku berikutnya adalah ${startN + 4}³ = ${answer}.`,
      };
    } else {
      const startN = randomInt(1, 4);
      const seq = [startN ** 2 + startN, (startN + 1) ** 2 + (startN + 1), (startN + 2) ** 2 + (startN + 2), (startN + 3) ** 2 + (startN + 3)];
      const answer = (startN + 4) ** 2 + (startN + 4);
      const { options, correctIndex } = buildUniqueTextOptions(answer, [answer + 4, answer - 4, answer + 8]);
      return {
        id: `geo_t6_poly_${Date.now()}_${Math.random()}`,
        category: 'geometris',
        categoryLabel: 'Pola Kuadrat Polinomial TPA (Tier 6 - Kelas 6 SD)',
        difficultyLevel: 6,
        question: `Lengkapi deret penalaran kuadrat dinamis TPA ini:\n${seq.join(', ')}, ?`,
        options,
        correctIndex,
        hint: `🔬 *Analisis Guru Lab:* Pola ini adalah (n² + n)! Maka ${startN + 4}² + ${startN + 4} = ${answer}.`,
      };
    }
  }
}

// ─── 3. Pola Gambar Visual (Grade 1 Intuitive + TPA Modes) ────────────────

function createVisualBox(tl: boolean, tr: boolean, bl: boolean, br: boolean, isQuestion = false): QuadrantBox {
  return { tl, tr, bl, br, isQuestion };
}

// 3.0. SPECIAL KELAS 1 SD VISUAL PUZZLES (Intuitive, Clear, & Pedagogical)
function generateGrade1VisualQuestion(subLevel: SubLevel = 'easy'): PatternQuestion {
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
      options: ['A', 'B', 'C', 'D'],
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
      options: ['A', 'B', 'C', 'D'],
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
      options: ['A', 'B', 'C', 'D'],
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
      options: ['A', 'B', 'C', 'D'],
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
function generateClockHandsQuestion(difficulty: DifficultyLevel, subLevel?: SubLevel): PatternQuestion {
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
    options: ['A', 'B', 'C', 'D'],
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
function generateCapsuleQuestion(difficulty: DifficultyLevel, subLevel?: SubLevel): PatternQuestion {
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
    options: ['A', 'B', 'C', 'D'],
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
function generateDominoQuestion(difficulty: DifficultyLevel, subLevel?: SubLevel): PatternQuestion {
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
    options: ['A', 'B', 'C', 'D'],
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
function generateShapesRowQuestion(difficulty: DifficultyLevel, subLevel?: SubLevel): PatternQuestion {
  if (difficulty === 1) {
    return generateGrade1VisualQuestion();
  }

  const allShapes: QuadrantBox['shapeType'][] = [
    'circle_filled',
    'triangle_filled',
    'square_filled',
    'star',
    'diamond',
    'circle_outline',
    'square_outline',
    'triangle_outline',
  ];

  if (difficulty === 2) {
    // Level 2 (Kelas 3-4): Latin Square 3 bentuk sederhana
    const selected3 = shuffleArray(allShapes).slice(0, 3);
    const [sA, sB, sC] = selected3;

    const boxes: QuadrantBox[] = [
      { shapeType: sA }, { shapeType: sB }, { shapeType: sC },
      { shapeType: sB }, { shapeType: sC }, { shapeType: sA },
      { shapeType: sC }, { shapeType: sA }, { isQuestion: true },
    ];

    const correctBox: QuadrantBox = { shapeType: sB };
    const candidateDistractors: QuadrantBox[] = [
      { shapeType: sA },
      { shapeType: sC },
      { shapeType: allShapes.find((s) => !selected3.includes(s)) || 'square_outline' },
    ];

    const optionBoxes = buildUniqueOptionBoxes(correctBox, candidateDistractors);
    const correctIndex = optionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

    return {
      id: `vis_shape_l2_${Date.now()}_${Math.random()}`,
      category: 'visual',
      categoryLabel: `Deret Pola Bentuk Geometri (Level 2 - SD 3/4)`,
      difficultyLevel: 2,
      question: `Setiap baris memiliki 3 bentuk berbeda. Bentuk apakah yang mengisi kotak ke-9?`,
      options: ['A', 'B', 'C', 'D'],
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* Setiap baris memiliki 3 bentuk yang sama (Latin Square). Baris ke-3 berisi ${sA?.replace('_',' ')}, ${sC?.replace('_',' ')}, lalu bentuk yang kurang: ${sB?.replace('_',' ')?.toUpperCase()}.`,
      visualMatrixData: {
        type: 'shapes_row',
        gridCols: 3,
        boxes,
        optionBoxes,
      },
    };
  }

  if (difficulty === 3) {
    // Level 3 (Kelas 5): Latin Square 4 bentuk berbeda — siklus ABCD, BCDA, CDAB → ? (DA missing)
    const selected4 = shuffleArray(allShapes).slice(0, 4);
    const [sA, sB, sC, sD] = selected4;

    // Row 1: A B C D (tak bisa tampil 4 di 3 kolom) — gunakan pola diagonal shift 4 dalam 3 kolom
    // Pola: tiap baris = rotasi 1 dari baris sebelumnya (offset +1 di siklus 4-bentuk)
    // Row1: A B C
    // Row2: B C D
    // Row3: C D ? -> jawaban A (siklus mod 4)
    const boxes: QuadrantBox[] = [
      { shapeType: sA }, { shapeType: sB }, { shapeType: sC },
      { shapeType: sB }, { shapeType: sC }, { shapeType: sD },
      { shapeType: sC }, { shapeType: sD }, { isQuestion: true },
    ];

    const correctBox: QuadrantBox = { shapeType: sA };
    const candidateDistractors: QuadrantBox[] = [
      { shapeType: sB },
      { shapeType: sC },
      { shapeType: sD },
    ];

    const optionBoxes = buildUniqueOptionBoxes(correctBox, candidateDistractors);
    const correctIndex = optionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

    return {
      id: `vis_shape_l3_${Date.now()}_${Math.random()}`,
      category: 'visual',
      categoryLabel: `Deret Pola 4 Bentuk Diagonal (Level 3 - SD 5)`,
      difficultyLevel: 3,
      question: `Analisis pola diagonal pergeseran 4 bentuk geometri pada matriks 3x3 berikut:`,
      options: ['A', 'B', 'C', 'D'],
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* Setiap baris bergeser 1 langkah maju dalam siklus 4 bentuk (A→B→C→D→A). Kolom ke-3 baris ke-3 kembali ke bentuk awal: ${sA?.replace('_',' ')?.toUpperCase()}.`,
      visualMatrixData: {
        type: 'shapes_row',
        gridCols: 3,
        boxes,
        optionBoxes,
      },
    };
  }

  // Level 4 (Kelas 6): Pola Ganda — tiap sel = bentuk UTAMA + POLA ISIAN bergantian
  // Gunakan 5 bentuk dalam siklus kompleks + filled/outline bergantian
  // Row1: A_filled, B_outline, C_filled
  // Row2: B_filled, C_outline, D_filled
  // Row3: C_filled, D_outline, ?  -> jawaban: E_filled (bentuk ke-5 berikutnya dalam siklus)
  const selected5 = shuffleArray(allShapes.filter((s): s is NonNullable<typeof s> => s !== undefined && !s.includes('_outline'))).slice(0, 3);
  const outlineVariants: Record<string, QuadrantBox['shapeType']> = {
    'circle_filled': 'circle_outline',
    'triangle_filled': 'triangle_outline',
    'square_filled': 'square_outline',
    'star': 'diamond',
    'diamond': 'star',
  };

  const [s1, s2, s3] = selected5;
  const s1o = outlineVariants[s1!] || 'circle_outline';
  const s2o = outlineVariants[s2!] || 'square_outline';

  const boxes: QuadrantBox[] = [
    { shapeType: s1 }, { shapeType: s1o }, { shapeType: s2 },
    { shapeType: s2 }, { shapeType: s2o }, { shapeType: s3 },
    { shapeType: s3 }, { shapeType: outlineVariants[s3!] || 'triangle_outline' }, { isQuestion: true },
  ];

  // Pattern: Col1=Xfilled, Col2=Xoutline, Col3=next_filled; setiap baris col1 = col3 baris sebelumnya
  // Kotak ke-9 (R3C3) = s1 lagi (siklus kembali ke awal)
  const correctBox: QuadrantBox = { shapeType: s1 };
  const candidateDistractors: QuadrantBox[] = [
    { shapeType: s2 },
    { shapeType: s3 },
    { shapeType: s1o },
  ];

  const optionBoxes = buildUniqueOptionBoxes(correctBox, candidateDistractors);
  const correctIndex = optionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

  return {
    id: `vis_shape_l4_${Date.now()}_${Math.random()}`,
    category: 'visual',
    categoryLabel: `Deret Pola Ganda Bentuk & Isian (Level 4 - SD 6)`,
    difficultyLevel: 4,
    question: `Analisis pola ganda: pergeseran bentuk DAN perubahan isian (filled/outline) pada matriks 3x3 ini:`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex,
    hint: `🔬 *Analisis Guru Lab:* Setiap baris: Kolom 1 = bentuk isian penuh, Kolom 2 = bentuk outline (kosong), Kolom 3 = bentuk berikutnya isian penuh. Baris ke-4 kembali ke bentuk pertama: ${s1?.replace('_',' ')?.toUpperCase()}.`,
    visualMatrixData: {
      type: 'shapes_row',
      gridCols: 3,
      boxes,
      optionBoxes,
    },
  };
}

// 3.6. Mode: Pentagon & Arrow (Reference Row 1)
function generatePentagonArrowQuestion(difficulty: DifficultyLevel, subLevel?: SubLevel): PatternQuestion {
  const stepAngle = pickRandom([45, 90, 72]);
  const startAngle = pickRandom([0, 45, 90, 180]);
  const startVertex = randomInt(0, 4);

  const boxes: QuadrantBox[] = [];
  for (let i = 0; i < 8; i++) {
    boxes.push({
      pentagonData: {
        arrowAngle: (startAngle + i * stepAngle) % 360,
        dotVertex: (startVertex + i) % 5,
      },
    });
  }
  boxes.push({ isQuestion: true });

  const correctAngle = (startAngle + 8 * stepAngle) % 360;
  const correctVertex = (startVertex + 8) % 5;
  const correctBox: QuadrantBox = {
    pentagonData: {
      arrowAngle: correctAngle,
      dotVertex: correctVertex,
    },
  };

  const candidateDistractors: QuadrantBox[] = [
    { pentagonData: { arrowAngle: (correctAngle + 90) % 360, dotVertex: correctVertex } },
    { pentagonData: { arrowAngle: correctAngle, dotVertex: (correctVertex + 1) % 5 } },
    { pentagonData: { arrowAngle: (correctAngle + 180) % 360, dotVertex: (correctVertex + 2) % 5 } },
  ];

  const optionBoxes = buildUniqueOptionBoxes(correctBox, candidateDistractors);
  const correctIndex = optionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

  return {
    id: `vis_penta_${Date.now()}_${Math.random()}`,
    category: 'visual',
    categoryLabel: `Deret Pentagon, Panah & Titik Orbit (Level ${difficulty})`,
    difficultyLevel: difficulty,
    question: `Analisis rotasi panah dalam pentagon (${stepAngle}°) dan pergeseran titik orbit pada sudutnya:`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex,
    hint: `🔬 *Analisis Guru Lab:* Panah berputar +${stepAngle}° searah jarum jam dan titik melompat ke sudut (vertex) berikutnya di tiap tahap.`,
    visualMatrixData: {
      type: 'pentagon_arrow',
      gridCols: 3,
      boxes,
      optionBoxes,
    },
  };
}

// 3.7. Mode: Pointer Hand Circle with Perimeter Orbiting Dot (Reference Row 2)
function generatePointerCircleQuestion(difficulty: DifficultyLevel, subLevel?: SubLevel): PatternQuestion {
  const stepAngle = pickRandom([45, 90]);
  const startAngle = pickRandom([0, 45, 90, 180, 270]);

  const boxes: QuadrantBox[] = [];
  for (let i = 0; i < 8; i++) {
    boxes.push({
      pointerCircleData: {
        dotPositionAngle: (startAngle + i * stepAngle) % 360,
      },
    });
  }
  boxes.push({ isQuestion: true });

  const correctAngle = (startAngle + 8 * stepAngle) % 360;
  const correctBox: QuadrantBox = {
    pointerCircleData: {
      dotPositionAngle: correctAngle,
    },
  };

  const candidateDistractors: QuadrantBox[] = [
    { pointerCircleData: { dotPositionAngle: (correctAngle + 45) % 360 } },
    { pointerCircleData: { dotPositionAngle: (correctAngle + 90) % 360 } },
    { pointerCircleData: { dotPositionAngle: (correctAngle + 180) % 360 } },
  ];

  const optionBoxes = buildUniqueOptionBoxes(correctBox, candidateDistractors);
  const correctIndex = optionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

  return {
    id: `vis_pointer_${Date.now()}_${Math.random()}`,
    category: 'visual',
    categoryLabel: `Deret Penunjuk & Orbit Keliling Lingkaran (Level ${difficulty})`,
    difficultyLevel: difficulty,
    question: `Perhatikan posisi penunjuk tangan dan rotasi titik pada keliling lingkaran pusat (${stepAngle}°):`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex,
    hint: `🔬 *Analisis Guru Lab:* Titik mengelilingi keliling lingkaran dengan perpindahan sudut +${stepAngle}°.`,
    visualMatrixData: {
      type: 'pointer_circle',
      gridCols: 3,
      boxes,
      optionBoxes,
    },
  };
}

// 3.8. Mode: Rotating Ring Notch / Arc (Reference Row 3)
function generateRingNotchQuestion(difficulty: DifficultyLevel, subLevel?: SubLevel): PatternQuestion {
  const stepAngle = pickRandom([45, 90, 135]);
  const startAngle = pickRandom([0, 45, 90, 180]);

  const boxes: QuadrantBox[] = [];
  for (let i = 0; i < 8; i++) {
    boxes.push({
      ringNotchData: {
        angle: (startAngle + i * stepAngle) % 360,
      },
    });
  }
  boxes.push({ isQuestion: true });

  const correctAngle = (startAngle + 8 * stepAngle) % 360;
  const correctBox: QuadrantBox = {
    ringNotchData: {
      angle: correctAngle,
    },
  };

  const candidateDistractors: QuadrantBox[] = [
    { ringNotchData: { angle: (correctAngle + 45) % 360 } },
    { ringNotchData: { angle: (correctAngle + 90) % 360 } },
    { ringNotchData: { angle: (correctAngle + 180) % 360 } },
  ];

  const optionBoxes = buildUniqueOptionBoxes(correctBox, candidateDistractors);
  const correctIndex = optionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

  return {
    id: `vis_ring_${Date.now()}_${Math.random()}`,
    category: 'visual',
    categoryLabel: `Deret Rotasi Cincin Takik / Busur (Level ${difficulty})`,
    difficultyLevel: difficulty,
    question: `Analisis arah rotasi busur cincin berlubang pada matriks berikut:`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex,
    hint: `🔬 *Analisis Guru Lab:* Cincin berlubang berputar +${stepAngle}° searah jarum jam pada setiap langkah.`,
    visualMatrixData: {
      type: 'ring_notch',
      gridCols: 3,
      boxes,
      optionBoxes,
    },
  };
}

// 3.9. Mode: Concentric / Nested Shapes (Reference Row 4)
function generateNestedShapesQuestion(difficulty: DifficultyLevel, subLevel?: SubLevel): PatternQuestion {
  const shapePool: ('circle' | 'triangle' | 'square' | 'diamond')[] = ['circle', 'triangle', 'diamond', 'square'];
  const outerIdx = randomInt(0, 3);
  const outerShape = shapePool[outerIdx];

  const boxes: QuadrantBox[] = [];
  for (let i = 0; i < 8; i++) {
    const innerShape = shapePool[(i + 1) % 4];
    boxes.push({
      nestedShapeData: {
        outerShape,
        innerShape,
        innerFilled: i % 2 === 0,
      },
    });
  }
  boxes.push({ isQuestion: true });

  const correctInner = shapePool[(8 + 1) % 4];
  const correctBox: QuadrantBox = {
    nestedShapeData: {
      outerShape,
      innerShape: correctInner,
      innerFilled: 8 % 2 === 0,
    },
  };

  const candidateDistractors: QuadrantBox[] = [
    { nestedShapeData: { outerShape, innerShape: shapePool[0], innerFilled: !(8 % 2 === 0) } },
    { nestedShapeData: { outerShape, innerShape: shapePool[2], innerFilled: 8 % 2 === 0 } },
    { nestedShapeData: { outerShape, innerShape: correctInner, innerFilled: !(8 % 2 === 0) } },
  ];

  const optionBoxes = buildUniqueOptionBoxes(correctBox, candidateDistractors);
  const correctIndex = optionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

  return {
    id: `vis_nested_${Date.now()}_${Math.random()}`,
    category: 'visual',
    categoryLabel: `Deret Gambar Bersarang (Level ${difficulty})`,
    difficultyLevel: difficulty,
    question: `Amati pergantian bentuk dalam (inner shape) dan pengisian warna pada gambar bersarang:`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex,
    hint: `🔬 *Analisis Guru Lab:* Bentuk luar tetap (${outerShape.toUpperCase()}), sedangkan bentuk dalam berganti secara teratur dan isian warnanya selang-seling.`,
    visualMatrixData: {
      type: 'nested_shapes',
      gridCols: 3,
      boxes,
      optionBoxes,
    },
  };
}

// 3.10. Mode: Spiderweb Network & Lightning (Reference Row 5)
function generateSpiderwebQuestion(difficulty: DifficultyLevel, subLevel?: SubLevel): PatternQuestion {
  const startBug = randomInt(0, 4);
  const startLightning = randomInt(0, 4);

  const boxes: QuadrantBox[] = [];
  for (let i = 0; i < 8; i++) {
    const bugVertex = (startBug + i) % 5;
    const lBranch = [(startLightning + i) % 5];
    boxes.push({
      spiderwebData: {
        lightningBranches: lBranch,
        bugVertex,
      },
    });
  }
  boxes.push({ isQuestion: true });

  const correctBug = (startBug + 8) % 5;
  const correctLightning = [(startLightning + 8) % 5];
  const correctBox: QuadrantBox = {
    spiderwebData: {
      lightningBranches: correctLightning,
      bugVertex: correctBug,
    },
  };

  const candidateDistractors: QuadrantBox[] = [
    { spiderwebData: { lightningBranches: [(correctLightning[0] + 1) % 5], bugVertex: correctBug } },
    { spiderwebData: { lightningBranches: correctLightning, bugVertex: (correctBug + 1) % 5 } },
    { spiderwebData: { lightningBranches: [(correctLightning[0] + 2) % 5], bugVertex: (correctBug + 2) % 5 } },
  ];

  const optionBoxes = buildUniqueOptionBoxes(correctBox, candidateDistractors);
  const correctIndex = optionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

  return {
    id: `vis_web_${Date.now()}_${Math.random()}`,
    category: 'visual',
    categoryLabel: `Deret Jaring Laba-Laba & Kilat Petir (Level ${difficulty})`,
    difficultyLevel: difficulty,
    question: `Analisis lintasan pergerakan serangga dan posisi sambaran petir pada simpul jaring:`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex,
    hint: `🔬 *Analisis Guru Lab:* Serangga berpindah +1 simpul searah jarum jam dan petir menyambar simpul berikutnya secara berurutan.`,
    visualMatrixData: {
      type: 'spiderweb_network',
      gridCols: 3,
      boxes,
      optionBoxes,
    },
  };
}

// 3.11. Mode: Grid 2x2 with Outer Corner Orbiting Dot (Reference Row 6)
function generateGridOuterDotQuestion(difficulty: DifficultyLevel, subLevel?: SubLevel): PatternQuestion {
  const positions: ('tl' | 'tr' | 'br' | 'bl')[] = ['tl', 'tr', 'br', 'bl'];
  const startDotIdx = randomInt(0, 3);
  const startGridIdx = randomInt(0, 3);

  const boxes: QuadrantBox[] = [];
  for (let i = 0; i < 8; i++) {
    const dotPos = positions[(startDotIdx + i) % 4];
    const gridActive = positions[(startGridIdx + i) % 4];
    boxes.push({
      gridOuterDotData: {
        tl: gridActive === 'tl',
        tr: gridActive === 'tr',
        bl: gridActive === 'bl',
        br: gridActive === 'br',
        outerDotPos: dotPos,
      },
    });
  }
  boxes.push({ isQuestion: true });

  const correctDotPos = positions[(startDotIdx + 8) % 4];
  const correctGridActive = positions[(startGridIdx + 8) % 4];
  const correctBox: QuadrantBox = {
    gridOuterDotData: {
      tl: correctGridActive === 'tl',
      tr: correctGridActive === 'tr',
      bl: correctGridActive === 'bl',
      br: correctGridActive === 'br',
      outerDotPos: correctDotPos,
    },
  };

  const candidateDistractors: QuadrantBox[] = [
    {
      gridOuterDotData: {
        tl: correctGridActive === 'tl',
        tr: correctGridActive === 'tr',
        bl: correctGridActive === 'bl',
        br: correctGridActive === 'br',
        outerDotPos: positions[(startDotIdx + 9) % 4],
      },
    },
    {
      gridOuterDotData: {
        tl: correctGridActive !== 'tl',
        tr: false,
        bl: false,
        br: true,
        outerDotPos: correctDotPos,
      },
    },
    {
      gridOuterDotData: {
        tl: true,
        tr: true,
        bl: false,
        br: false,
        outerDotPos: positions[(startDotIdx + 10) % 4],
      },
    },
  ];

  const optionBoxes = buildUniqueOptionBoxes(correctBox, candidateDistractors);
  const correctIndex = optionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

  return {
    id: `vis_gridot_${Date.now()}_${Math.random()}`,
    category: 'visual',
    categoryLabel: `Deret Grid 2x2 & Titik Sudut Luar (Level ${difficulty})`,
    difficultyLevel: difficulty,
    question: `Analisis pergerakan shading grid dalam dan orbit titik pada 4 sudut luar:`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex,
    hint: `🔬 *Analisis Guru Lab:* Titik sudut luar berputar searah jarum jam mengelilingi 4 sudut kotak grid.`,
    visualMatrixData: {
      type: 'grid_outer_dot',
      gridCols: 3,
      boxes,
      optionBoxes,
    },
  };
}

// 3.12. Mode: Central Shape with Orbiting Satellite Dots Ring (Reference Row 7)
function generateOrbitDotsQuestion(difficulty: DifficultyLevel, subLevel?: SubLevel): PatternQuestion {
  const shapes: ('diamond' | 'square' | 'triangle' | 'circle')[] = ['diamond', 'square', 'triangle', 'circle'];
  const centerShape = pickRandom(shapes);
  const startIdx = randomInt(0, 5);

  const boxes: QuadrantBox[] = [];
  for (let i = 0; i < 8; i++) {
    const active = [(startIdx + i) % 6, (startIdx + i + 1) % 6];
    boxes.push({
      orbitDotsData: {
        centerShape,
        centerFilled: i % 2 === 0,
        activeDots: active,
      },
    });
  }
  boxes.push({ isQuestion: true });

  const correctActive = [(startIdx + 8) % 6, (startIdx + 8 + 1) % 6];
  const correctBox: QuadrantBox = {
    orbitDotsData: {
      centerShape,
      centerFilled: 8 % 2 === 0,
      activeDots: correctActive,
    },
  };

  const candidateDistractors: QuadrantBox[] = [
    {
      orbitDotsData: {
        centerShape,
        centerFilled: !(8 % 2 === 0),
        activeDots: correctActive,
      },
    },
    {
      orbitDotsData: {
        centerShape,
        centerFilled: 8 % 2 === 0,
        activeDots: [(startIdx + 9) % 6, (startIdx + 10) % 6],
      },
    },
    {
      orbitDotsData: {
        centerShape: shapes.find((s) => s !== centerShape) || 'circle',
        centerFilled: 8 % 2 === 0,
        activeDots: correctActive,
      },
    },
  ];

  const optionBoxes = buildUniqueOptionBoxes(correctBox, candidateDistractors);
  const correctIndex = optionBoxes.findIndex((b) => areBoxesEqual(b, correctBox));

  return {
    id: `vis_orbitdots_${Date.now()}_${Math.random()}`,
    category: 'visual',
    categoryLabel: `Deret Bentuk Pusat & Ring Satelit Dot (Level ${difficulty})`,
    difficultyLevel: difficulty,
    question: `Analisis pergeseran 2 titik hitam aktif pada ring 6 satelit di sekeliling bentuk pusat:`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex,
    hint: `🔬 *Analisis Guru Lab:* Dua titik aktif berputar 1 langkah searah jarum jam mengelilingi 6 posisi satelit.`,
    visualMatrixData: {
      type: 'orbit_dots',
      gridCols: 3,
      boxes,
      optionBoxes,
    },
  };
}

// Helper to construct 2x2 quadrant matrix questions
function buildVisualMatrixQuestion(
  categoryLabel: string,
  questionText: string,
  hintText: string,
  boxes: QuadrantBox[],
  correctBox: QuadrantBox,
  difficulty: DifficultyLevel
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
    options: ['A', 'B', 'C', 'D'],
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

function generateVisualMatrixQuestion(difficulty: DifficultyLevel, subLevel: SubLevel = 'easy'): PatternQuestion {
  if (difficulty === 1) {
    return generateGrade1VisualQuestion(subLevel);
  }

  // ── STRICT MODE GATING & INTRA-TIER GRADATION (Kelas 1 - 6 SD) ───────────
  let mode: string;

  if (difficulty === 2) {
    // Kelas 2 SD: Pola intuitif sederhana
    if (subLevel === 'easy') mode = 'domino_dots';
    else if (subLevel === 'mid') mode = 'clock_hands';
    else mode = pickRandom(['shapes_row', 'quadrant_grid_1']);
  } else if (difficulty === 3) {
    // Kelas 3 SD: Pola rotasi & bentuk dasar
    if (subLevel === 'easy') mode = 'clock_hands';
    else if (subLevel === 'mid') mode = 'shapes_row';
    else mode = pickRandom(['domino_dots', 'quadrant_grid_2', 'quadrant_grid_3']);
  } else if (difficulty === 4) {
    // Kelas 4 SD: Pola geometri menengah & cincin
    if (subLevel === 'easy') mode = 'shapes_row';
    else if (subLevel === 'mid') mode = 'ring_notch';
    else mode = pickRandom(['capsule_symbols', 'nested_shapes', 'quadrant_grid_4']);
  } else if (difficulty === 5) {
    // Kelas 5 SD: Pola TPA lanjutan
    if (subLevel === 'easy') mode = 'nested_shapes';
    else if (subLevel === 'mid') mode = 'grid_outer_dot';
    else mode = pickRandom(['pentagon_arrow', 'spiderweb_network', 'shapes_row']);
  } else {
    // Kelas 6 SD: STRICTLY AUTHENTIC TPA PEAK (TIDAK ADA SOAL MUDAH)
    if (subLevel === 'easy') {
      mode = pickRandom(['pentagon_arrow', 'spiderweb_network']);
    } else if (subLevel === 'mid') {
      mode = pickRandom(['pointer_circle', 'orbit_dots', 'grid_outer_dot']);
    } else {
      mode = pickRandom(['orbit_dots', 'spiderweb_network', 'pentagon_arrow', 'grid_outer_dot', 'quadrant_grid_5']);
    }
  }

  if (mode === 'clock_hands') return generateClockHandsQuestion(difficulty, subLevel);
  if (mode === 'capsule_symbols') return generateCapsuleQuestion(difficulty, subLevel);
  if (mode === 'domino_dots') return generateDominoQuestion(difficulty, subLevel);
  if (mode === 'shapes_row') return generateShapesRowQuestion(difficulty, subLevel);
  if (mode === 'pentagon_arrow') return generatePentagonArrowQuestion(difficulty, subLevel);
  if (mode === 'pointer_circle') return generatePointerCircleQuestion(difficulty, subLevel);
  if (mode === 'ring_notch') return generateRingNotchQuestion(difficulty, subLevel);
  if (mode === 'nested_shapes') return generateNestedShapesQuestion(difficulty, subLevel);
  if (mode === 'spiderweb_network') return generateSpiderwebQuestion(difficulty, subLevel);
  if (mode === 'grid_outer_dot') return generateGridOuterDotQuestion(difficulty, subLevel);
  if (mode === 'orbit_dots') return generateOrbitDotsQuestion(difficulty, subLevel);

  // Quadrant variations
  const qType = mode === 'quadrant_grid_1' ? 1 : mode === 'quadrant_grid_2' ? 2 : mode === 'quadrant_grid_3' ? 3 : mode === 'quadrant_grid_4' ? 4 : 5;
  return generateQuadrantVariation(qType, difficulty);
}

function generateQuadrantVariation(patternType: number, difficulty: DifficultyLevel): PatternQuestion {

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

function generateLabScience(difficulty: DifficultyLevel, subLevel: SubLevel = 'easy'): PatternQuestion {
  if (difficulty <= 2) {
    const isTemp = Math.random() > 0.5;
    if (isTemp) {
      const startTemp = randomInt(15, 35);
      const step = difficulty === 1 ? (subLevel === 'easy' ? 1 : 2) : (subLevel === 'easy' ? 3 : 5);
      const seq = [`${startTemp}°C`, `${startTemp + step}°C`, `${startTemp + step * 2}°C`];
      const answer = `${startTemp + step * 3}°C`;
      const { options, correctIndex } = buildUniqueTextOptions(startTemp + step * 3, [startTemp + step * 4, startTemp + step * 2 + 1, startTemp + step * 3 + 3]);
      const allOpts = options.map((o) => (o.endsWith('°C') ? o : `${o}°C`));
      return {
        id: `lab_t${difficulty}_temp_${Date.now()}_${Math.random()}`,
        category: 'lab_science',
        categoryLabel: `Suhu Larutan Lab (Tier ${difficulty} - Kelas ${difficulty} SD)`,
        difficultyLevel: difficulty,
        question: `Suhu pemanasan larutan di lab naik teratur +${step}°C setiap menit:\n${seq.join(' ➔ ')} ➔ ?`,
        options: allOpts,
        correctIndex,
        hint: `🔬 *Analisis Guru Lab:* Tambahkan +${step}°C ke suhu terakhir: ${seq[seq.length - 1]} + ${step}°C = ${answer}.`,
      };
    } else {
      const startVol = randomInt(5, 20);
      const step = difficulty === 1 ? (subLevel === 'easy' ? 2 : 5) : 10;
      const seq = [`${startVol} ml`, `${startVol + step} ml`, `${startVol + step * 2} ml`];
      const answer = `${startVol + step * 3} ml`;
      const { options, correctIndex } = buildUniqueTextOptions(startVol + step * 3, [startVol + step * 4, startVol + step * 2 + 5, startVol + step * 3 + 10]);
      const allOpts = options.map((o) => (o.endsWith('ml') ? o : `${o} ml`));
      return {
        id: `lab_t${difficulty}_vol_${Date.now()}_${Math.random()}`,
        category: 'lab_science',
        categoryLabel: `Volume Larutan Lab (Tier ${difficulty} - Kelas ${difficulty} SD)`,
        difficultyLevel: difficulty,
        question: `Volume penambahan cairan sampel bertambah +${step} ml setiap tahap:\n${seq.join(' ➔ ')} ➔ ?`,
        options: allOpts,
        correctIndex,
        hint: `🔬 *Analisis Guru Lab:* Tambahkan +${step} ml ke volume terakhir: ${seq[seq.length - 1]} + ${step} ml = ${answer}.`,
      };
    }
  } else if (difficulty <= 4) {
    const isHalfLife = subLevel === 'hard' || difficulty === 4;
    if (isHalfLife) {
      const startMass = pickRandom([160, 240, 320, 480]);
      const seq = [`${startMass} g`, `${startMass / 2} g`, `${startMass / 4} g`];
      const answer = `${startMass / 8} g`;
      const { options, correctIndex } = buildUniqueTextOptions(startMass / 8, [startMass / 6, startMass / 10, startMass / 16]);
      const allOpts = options.map((o) => (o.endsWith('g') ? o : `${o} g`));
      return {
        id: `lab_t${difficulty}_half_${Date.now()}_${Math.random()}`,
        category: 'lab_science',
        categoryLabel: `Waktu Paruh Zat Lab (Tier ${difficulty} - Kelas ${difficulty} SD)`,
        difficultyLevel: difficulty,
        question: `Peluruhan zat aktif berkurang setengahnya (÷2) setiap periode:\n${seq.join(' ➔ ')} ➔ ?`,
        options: allOpts,
        correctIndex,
        hint: `🔬 *Analisis Guru Lab:* Massa zat dibagi 2 di setiap tahap: ${seq[seq.length - 1]} ÷ 2 = ${answer}.`,
      };
    } else {
      const mult = 2;
      const startCells = randomInt(2, 8);
      const seq = [`${startCells} Sel`, `${startCells * mult} Sel`, `${startCells * mult * mult} Sel`];
      const answer = `${startCells * mult * mult * mult} Sel`;
      const { options, correctIndex } = buildUniqueTextOptions(startCells * mult ** 3, [startCells * mult * 2, startCells * mult * 3, startCells * mult ** 3 + 2]);
      const allOpts = options.map((o) => (o.endsWith('Sel') ? o : `${o} Sel`));
      return {
        id: `lab_t${difficulty}_bac_${Date.now()}_${Math.random()}`,
        category: 'lab_science',
        categoryLabel: `Pembelahan Bakteri (Tier ${difficulty} - Kelas ${difficulty} SD)`,
        difficultyLevel: difficulty,
        question: `Bakteri membelah diri ×${mult} setiap jam:\n${seq.join(' ➔ ')} ➔ ?`,
        options: allOpts,
        correctIndex,
        hint: `🔬 *Analisis Guru Lab:* Setiap jam jumlah sel dikali ${mult}. Maka ${seq[seq.length - 1]} × ${mult} = ${answer}.`,
      };
    }
  } else {
    // Tier 5 & 6: Eksperimen Tingkat Lanjut / TPA Kimia-Biologi
    const mult = difficulty === 6 ? pickRandom([3, 4]) : 3;
    const startCells = randomInt(2, 6);
    const seq = [`${startCells} Sel`, `${startCells * mult} Sel`, `${startCells * mult * mult} Sel`];
    const answer = `${startCells * mult ** 3} Sel`;
    const { options, correctIndex } = buildUniqueTextOptions(startCells * mult ** 3, [startCells * mult ** 2 * 2, startCells * mult ** 3 - mult, startCells * mult ** 3 + mult]);
    const allOpts = options.map((o) => (o.endsWith('Sel') ? o : `${o} Sel`));
    return {
      id: `lab_t${difficulty}_peak_${Date.now()}_${Math.random()}`,
      category: 'lab_science',
      categoryLabel: `Eksperimen Eksponensial Lab TPA (Tier ${difficulty} - Kelas ${difficulty} SD)`,
      difficultyLevel: difficulty,
      question: `Kultur mikroba berkembang biak secara eksponensial ×${mult} kali lipat setiap siklus:\n${seq.join(' ➔ ')} ➔ ?`,
      options: allOpts,
      correctIndex,
      hint: `🔬 *Analisis Guru Lab:* Setiap siklus dikali ${mult}. Maka ${seq[seq.length - 1]} × ${mult} = ${answer}.`,
    };
  }
}

// ─── MASTER PROGRESSIVE ENDLESS QUESTION DISPATCHER ─────────────────────────

function dispatchPatternQuestion(
  questionNumber: number,
  previousCategory?: PatternCategory,
  grade: number = 6
): PatternQuestion {
  const difficulty = getDifficultyForGrade(grade);
  const subLevel = getSubLevelForQuestionNumber(questionNumber);

  // 60% Visual Image Series (3x3 Matrix) vs 40% Number/Math Logic
  const isVisual = Math.random() < 0.60;

  if (isVisual) {
    return generateVisualMatrixQuestion(difficulty, subLevel);
  } else {
    const mathCategories: PatternCategory[] = ['aritmatika', 'geometris', 'lab_science'];
    const available =
      previousCategory && mathCategories.includes(previousCategory)
        ? mathCategories.filter((c) => c !== previousCategory)
        : mathCategories;
    const chosenCategory = pickRandom(available);

    switch (chosenCategory) {
      case 'aritmatika':
        return generateArithmetic(difficulty, subLevel);
      case 'geometris':
        return generateGeometric(difficulty, subLevel);
      case 'lab_science':
        return generateLabScience(difficulty, subLevel);
      default:
        return generateArithmetic(difficulty, subLevel);
    }
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
