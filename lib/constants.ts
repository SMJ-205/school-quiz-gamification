// ─── Character Selection Definitions ───────────────────────────────────────────

export interface CharacterOption {
  value: 'boy' | 'girl';
  label: string; // Bahasa Indonesia
  title: string;
  emoji: string;
  desc: string;
}

export const GENDER_OPTIONS: CharacterOption[] = [
  {
    value: 'boy',
    title: 'Murid Laki-laki',
    label: 'Seragam Merah Putih & Topi',
    emoji: '👦',
    desc: 'Pelajar pemberani siap berpetualang membuka arsip ilmu pengetahuan',
  },
  {
    value: 'girl',
    title: 'Murid Perempuan',
    label: 'Seragam Merah Putih & Hijab',
    emoji: '👧',
    desc: 'Pelajar cerdas berhijab putih siap menempuh jembatan kristal ilmu',
  },
];

export const DEFAULT_CHARACTER = {
  gender: 'boy' as const,
};

// ─── Score / star rating thresholds ──────────────────────────────────────────

export function getStarRating(correctCount: number, total: number): number {
  const pct = total > 0 ? (correctCount / total) * 100 : 0;
  if (pct >= 90) return 5;
  if (pct >= 75) return 4;
  if (pct >= 60) return 3;
  if (pct >= 40) return 2;
  return 1;
}

// ─── NotebookLM prompt template ───────────────────────────────────────────────

export const NOTEBOOKLM_PROMPT = `Kamu adalah seorang guru dan akademisi ahli. Berdasarkan materi yang diunggah, buatlah kuis berisi 10 soal pilihan ganda yang mendidik dan seru.

Format output harus berupa Markdown dengan struktur berikut:

---
title: "[Nama Mata Pelajaran & Topik]"
grade: [Nomor Kelas/Tingkat 1-12]
subject: "[Mata Pelajaran: IPA / IPS / Matematika / Sejarah / dll.]"
author: "The Growth of Knowledge"
---

### Q1
[Tulis Soal 1 di sini]
- [ ] [Pilihan A]
- [x] [Pilihan B - Tandai dengan x jika benar]
- [ ] [Pilihan C]
- [ ] [Pilihan D]
*Hint: [Tulis petunjuk ramah 1 kalimat yang menjelaskan konsep kunci]*

### Q2
...`;

// ─── Arena config ─────────────────────────────────────────────────────────────

export function getArenaForQuestion(index: number): 'quiz_library' | 'quiz_bridge' {
  return Math.floor(index / 5) % 2 === 0 ? 'quiz_library' : 'quiz_bridge';
}
