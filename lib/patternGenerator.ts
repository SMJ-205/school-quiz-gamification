/**
 * patternGenerator.ts
 * Procedural Question Generator for "Detektif Pola" (Pattern & Sequence Predictor)
 * Features strict grade-based difficulty scaling (Kelas 1 to Kelas 6 SD)
 * and 2D visual matrix grid patterns (3x3 quadrant boxes matching psikotes image standard).
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

// ─── 1. Aritmatika & Bertingkat (Progressive) ──────────────────────────────

function generateArithmetic(difficulty: 1 | 2 | 3 | 4): PatternQuestion {
  if (difficulty === 1) {
    // Level 1: Super Easy Constant Addition (+1, +2, +3, +5) or Subtraction (-1)
    const isSub = Math.random() > 0.6;
    if (isSub) {
      const start = randomInt(8, 15);
      const seq = [start, start - 1, start - 2, start - 3];
      const answer = start - 4;
      const distractors = [answer + 2, answer - 1, answer + 1];
      const allOpts = shuffleArray([answer.toString(), ...distractors.map((d) => d.toString())]);
      const correctIdx = allOpts.indexOf(answer.toString());

      return {
        id: `arit_l1_${Date.now()}_${Math.random()}`,
        category: 'aritmatika',
        categoryLabel: 'Aritmatika Dasar (Level 1)',
        difficultyLevel: 1,
        question: `Detektif cilik, tentukan angka berikutnya yang berkurang 1 ini:\n${seq.join(', ')}, ?`,
        options: allOpts,
        correctIndex: correctIdx,
        hint: `🔬 *Analisis Guru Lab:* Setiap langkah selalu berkurang -1. Jadi ${seq[seq.length - 1]} - 1 = ${answer}.`,
      };
    } else {
      const step = pickRandom([1, 2, 3]);
      const start = randomInt(1, 10);
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
        question: `Detektif cilik, tentukan angka berikutnya dari pola angka ini:\n${seq.join(', ')}, ?`,
        options: allOpts,
        correctIndex: correctIdx,
        hint: `🔬 *Analisis Guru Lab:* Setiap langkah selalu bertambah +${step}. Jadi ${seq[seq.length - 1]} + ${step} = ${answer}.`,
      };
    }
  } else if (difficulty === 2) {
    // Level 2: Increasing Step (+2, +3, +4, +5)
    const start = randomInt(1, 8);
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
  } else if (difficulty === 3) {
    // Level 3: Alternating +/- (+5, -2, +5, -2)
    const addVal = randomInt(4, 7);
    const subVal = randomInt(1, 3);
    const start = randomInt(10, 25);
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
    // Level 4 (Max SD Kelas 6): Fibonacci Sederhana (1, 2, 3, 5, 8, 13)
    const a = randomInt(1, 4);
    const b = randomInt(1, 5);
    const seq = [a, b, a + b, a + 2 * b, 2 * a + 3 * b];
    const answer = 3 * a + 5 * b;

    const distractors = [answer + a, answer - b, answer + 3];
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

// ─── 2. Geometris & Kuadrat (Progressive) ──────────────────────────────────

function generateGeometric(difficulty: 1 | 2 | 3 | 4): PatternQuestion {
  if (difficulty === 1) {
    // Level 1: Simple Even Numbers (+2 constant)
    const start = pickRandom([2, 4, 6, 10]);
    const seq = [start, start + 2, start + 4, start + 6];
    const answer = start + 8;

    const distractors = [answer + 1, answer - 1, answer + 3];
    const allOpts = shuffleArray([answer.toString(), ...distractors.map((d) => d.toString())]);
    const correctIdx = allOpts.indexOf(answer.toString());

    return {
      id: `geo_l1_${Date.now()}_${Math.random()}`,
      category: 'geometris',
      categoryLabel: 'Pola Angka Loncat 2 (Level 1)',
      difficultyLevel: 1,
      question: `Tentukan angka berikutnya dari pola loncat 2 ini:\n${seq.join(', ')}, ?`,
      options: allOpts,
      correctIndex: correctIdx,
      hint: `🔬 *Analisis Guru Lab:* Angka selalu melompat +2. ${seq[seq.length - 1]} + 2 = ${answer}.`,
    };
  } else if (difficulty === 2) {
    // Level 2: Multiplication x2
    const start = randomInt(2, 6);
    const seq = [start, start * 2, start * 4, start * 8];
    const answer = start * 16;

    const distractors = [answer + 4, answer - start, answer + 8];
    const allOpts = shuffleArray([answer.toString(), ...distractors.map((d) => d.toString())]);
    const correctIdx = allOpts.indexOf(answer.toString());

    return {
      id: `geo_l2_${Date.now()}_${Math.random()}`,
      category: 'geometris',
      categoryLabel: 'Perkalian Ganda (Level 2)',
      difficultyLevel: 2,
      question: `Tentukan angka berikutnya dari pola kelipatan 2 ini:\n${seq.join(', ')}, ?`,
      options: allOpts,
      correctIndex: correctIdx,
      hint: `🔬 *Analisis Guru Lab:* Setiap angka dikali 2 (×2)! ${seq[seq.length - 1]} × 2 = ${answer}.`,
    };
  } else if (difficulty === 3) {
    // Square Numbers (1, 4, 9, 16, 25, 36)
    const seq = [1, 4, 9, 16, 25];
    const answer = 36;

    const distractors = [30, 32, 40];
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
      hint: `🔬 *Analisis Guru Lab:* Ini adalah deret kuadrat (1², 2², 3², 4², 5²...). Angka berikutnya adalah 6² = 36.`,
    };
  } else {
    // Level 4 (Max SD 6): Square Numbers with Offset (+1 or -1)
    const seq = [2, 5, 10, 17, 26]; // n^2 + 1
    const answer = 37; // 6^2 + 1

    const distractors = [35, 36, 40];
    const allOpts = shuffleArray([answer.toString(), ...distractors.map((d) => d.toString())]);
    const correctIdx = allOpts.indexOf(answer.toString());

    return {
      id: `geo_l4_${Date.now()}_${Math.random()}`,
      category: 'geometris',
      categoryLabel: 'Pola Kuadrat Offset (Level 4 - SD 6)',
      difficultyLevel: 4,
      question: `Soal Penalaran Lanjutan — Lengkapi deret kuadrat bertambah 1 ini:\n${seq.join(', ')}, ?`,
      options: allOpts,
      correctIndex: correctIdx,
      hint: `🔬 *Analisis Guru Lab:* Pola ini adalah (n² + 1)! (1²+1=2, 2²+1=5, 3²+1=10...). Langkah berikutnya adalah 6² + 1 = 37.`,
    };
  }
}

// ─── 3. Pola Gambar Visual (Quadrant Box Matrix 3x3) ────────────────────────

function generateVisualMatrixQuestion(difficulty: 1 | 2 | 3 | 4): PatternQuestion {
  if (difficulty <= 2) {
    // Level 1-2: Clockwise rotation of 1 shaded quadrant in 2x2 grid
    const boxes: QuadrantBox[] = [
      { tl: true, tr: false, bl: false, br: false }, // Box 1
      { tl: false, tr: true, bl: false, br: false }, // Box 2
      { tl: false, tr: false, bl: false, br: true }, // Box 3
      { tl: false, tr: false, bl: true, br: false }, // Box 4
      { tl: true, tr: false, bl: false, br: false }, // Box 5
      { tl: false, tr: true, bl: false, br: false }, // Box 6
      { tl: false, tr: false, bl: false, br: true }, // Box 7
      { tl: false, tr: false, bl: true, br: false }, // Box 8
      { tl: false, tr: false, bl: false, br: false, isQuestion: true }, // Box 9 (?)
    ];

    const correctBox: QuadrantBox = { tl: true, tr: false, bl: false, br: false };
    const optionBoxes: QuadrantBox[] = [
      { tl: false, tr: true, bl: false, br: false }, // A
      { tl: true, tr: false, bl: false, br: false },  // B (Correct)
      { tl: false, tr: false, bl: true, br: false }, // C
      { tl: false, tr: false, bl: false, br: true }, // D
    ];

    const correctIdx = 1; // B

    return {
      id: `vis_mat_l1_${Date.now()}_${Math.random()}`,
      category: 'visual',
      categoryLabel: `Deret Gambar Rotasi 2D (Level ${difficulty})`,
      difficultyLevel: difficulty,
      question: `Perhatikan rotasi kotak hitam searah jarum jam pada matriks gambar 3x3 berikut:`,
      options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
      correctIndex: correctIdx,
      hint: `🔬 *Analisis Guru Lab:* Kotak hitam berputar searah jarum jam (Top-Left ➔ Top-Right ➔ Bottom-Right ➔ Bottom-Left). Pada kotak ke-9, posisi kembali ke Top-Left (Opsi B).`,
      visualMatrixData: {
        type: 'quadrant_matrix',
        gridCols: 3,
        boxes,
        optionBoxes,
      },
    };
  } else {
    // Level 3-4 (Max SD 6): 3x3 Matrix matching User Attachment Image 1!
    const boxes: QuadrantBox[] = [
      { tl: true, tr: false, bl: false, br: false },  // R1C1
      { tl: false, tr: false, bl: false, br: true },  // R1C2
      { tl: true, tr: false, bl: false, br: true },   // R1C3
      { tl: true, tr: true, bl: false, br: false },   // R2C1
      { tl: false, tr: true, bl: true, br: false },   // R2C2
      { tl: true, tr: false, bl: true, br: false },   // R2C3
      { tl: false, tr: true, bl: true, br: false },   // R3C1
      { tl: true, tr: false, bl: false, br: true },   // R3C2
      { tl: false, tr: false, bl: false, br: false, isQuestion: true }, // R3C3 (?)
    ];

    const correctBox: QuadrantBox = { tl: true, tr: true, bl: true, br: false };
    const optionBoxes: QuadrantBox[] = [
      { tl: false, tr: true, bl: false, br: true },   // A
      { tl: false, tr: false, bl: true, br: true },   // B
      { tl: true, tr: true, bl: true, br: false },    // C (Correct)
      { tl: true, tr: true, bl: false, br: true },    // D
    ];

    const correctIdx = 2; // C

    return {
      id: `vis_mat_l4_${Date.now()}_${Math.random()}`,
      category: 'visual',
      categoryLabel: `Deret Pola Gambar 3x3 (Level ${difficulty} - SD 6)`,
      difficultyLevel: difficulty,
      question: `Analisis Matriks Gambar 3x3 — Tentukan susunan kotak hitam pada posisi (?):`,
      options: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
      correctIndex: correctIdx,
      hint: `🔬 *Analisis Guru Lab:* Perhatikan hubungan pola tiap baris! Jumlah area hitam bertambah dan bergerak secara sistematis. Kotak yang tepat untuk melengkapi matriks ke-9 adalah Opsi C.`,
      visualMatrixData: {
        type: 'quadrant_matrix',
        gridCols: 3,
        boxes,
        optionBoxes,
      },
    };
  }
}

// ─── 4. Sains & Lab Experiments (Progressive) ──────────────────────────────

function generateLabScience(difficulty: 1 | 2 | 3 | 4): PatternQuestion {
  if (difficulty <= 2) {
    const startTemp = 20;
    const step = 5;
    const seq = [`${startTemp}°C`, `${startTemp + step}°C`, `${startTemp + step * 2}°C`];
    const answer = `${startTemp + step * 3}°C`;

    const distractors = [`${startTemp + step * 4}°C`, `${startTemp + step * 2 + 2}°C`, `${startTemp + step * 3 + 5}°C`].filter((d) => d !== answer);
    const allOpts = shuffleArray([answer, ...distractors.slice(0, 3)]);
    const correctIdx = allOpts.indexOf(answer);

    return {
      id: `lab_l1_${Date.now()}_${Math.random()}`,
      category: 'lab_science',
      categoryLabel: 'Suhu Lab (Level 1-2)',
      difficultyLevel: difficulty,
      question: `Suhu pemanasan larutan di lab naik teratur +5°C setiap menit:\n${seq.join(' ➔ ')} ➔ ?`,
      options: allOpts,
      correctIndex: correctIdx,
      hint: `🔬 *Analisis Guru Lab:* Tambahkan +5°C ke suhu terakhir: ${seq[seq.length - 1]} + 5°C = ${answer}.`,
    };
  } else {
    // Level 3-4: Bacterial doubling
    const startCells = 10;
    const seq = [`${startCells} Sel`, `${startCells * 2} Sel`, `${startCells * 4} Sel`, `${startCells * 8} Sel`];
    const answer = `${startCells * 16} Sel`;

    const distractors = [`${startCells * 12} Sel`, `${startCells * 10} Sel`, `${startCells * 32} Sel`].filter((d) => d !== answer);
    const allOpts = shuffleArray([answer, ...distractors.slice(0, 3)]);
    const correctIdx = allOpts.indexOf(answer);

    return {
      id: `lab_l4_${Date.now()}_${Math.random()}`,
      category: 'lab_science',
      categoryLabel: `Pembelahan Bakteri (Level ${difficulty})`,
      difficultyLevel: difficulty,
      question: `Eksperimen Biologi — Bakteri membelah diri 2 kali lipat setiap jam:\n${seq.join(' ➔ ')} ➔ ?`,
      options: allOpts,
      correctIndex: correctIdx,
      hint: `🔬 *Analisis Guru Lab:* Setiap tahap dikali 2 (×2). Maka ${seq[seq.length - 1]} × 2 = ${answer}.`,
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

  // Every 3rd question for Level >= 2, guarantee a visual figure matrix question!
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
