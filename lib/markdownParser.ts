import matter from 'gray-matter';
import { QuizItem, QuizMetadata } from '@/store/useGameStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedQuizData {
  metadata: QuizMetadata;
  questions: QuizItem[];
}

// ─── Parser ───────────────────────────────────────────────────────────────────

/**
 * Parses a Markdown quiz file generated from the NotebookLM template schema.
 *
 * Expected format:
 * ---
 * title: "Sistem Tata Surya"
 * grade: 5
 * subject: "IPA"
 * author: "NotebookLM"
 * ---
 * ### Q1
 * Apa planet terbesar di tata surya?
 * - [ ] Bumi
 * - [x] Jupiter
 * - [ ] Mars
 * - [ ] Venus
 * *Hint: Planet ini punya banyak bulan dan badai besar.*
 */
export function parseQuizMarkdown(fileContent: string): ParsedQuizData {
  const { data, content } = matter(fileContent);

  // ─── Frontmatter metadata ──────────────────────────────────────────────────
  const metadata: QuizMetadata = {
    title: data.title || 'Petualangan Ujian SD',
    grade: Number(data.grade) || 4,
    subject: data.subject || 'Materi Umum',
    author: data.author || 'Guru / Orang Tua',
  };

  // ─── Question blocks ───────────────────────────────────────────────────────
  const questionBlocks = content
    .split(/###\s+Q\d+/g)
    .filter((block) => block.trim().length > 0);

  if (questionBlocks.length === 0) {
    throw new Error(
      'Format file Markdown tidak valid atau tidak memiliki soal. ' +
      'Pastikan menggunakan template NotebookLM yang benar.'
    );
  }

  const questions: QuizItem[] = questionBlocks.map((block, index) => {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const questionText = lines[0] || `Pertanyaan ${index + 1}`;
    const options: string[] = [];
    let correctIndex = 0;
    let hint = 'Baca kembali materi dengan seksama!';

    lines.slice(1).forEach((line) => {
      if (line.startsWith('- [x]') || line.startsWith('- [X]')) {
        correctIndex = options.length;
        options.push(line.replace(/- \[[xX]\]\s*/, '').trim());
      } else if (line.startsWith('- [ ]')) {
        options.push(line.replace(/- \[\s*\]\s*/, '').trim());
      } else if (line.startsWith('*Hint:') || line.startsWith('_Hint:')) {
        hint = line
          .replace(/[*_]Hint:\s*[*_]?/, '')
          .replace(/[*_]$/, '')
          .trim();
      }
    });

    // Validate we got at least 2 options
    if (options.length < 2) {
      throw new Error(
        `Soal #${index + 1} tidak memiliki cukup pilihan jawaban (minimal 2 diperlukan).`
      );
    }

    return {
      id: index + 1,
      question: questionText,
      options,
      correctIndex,
      hint,
    };
  });

  return { metadata, questions };
}

// ─── File reader helper ────────────────────────────────────────────────────────

export function readMarkdownFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Tidak dapat membaca file.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.readAsText(file, 'UTF-8');
  });
}
