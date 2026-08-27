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
  // Support ### Q1, ### Q 1, ## Q1, ### Soal 1, ## Soal 1, ### 1., ## 1:, etc.
  let questionBlocks = content
    .split(/(?:^|\n)#{1,4}\s*(?:(?:Q|Soal|Pertanyaan|No\.?|Nomor)\s*\d+|\d+\s*[.:\)])/gi)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  // Fallback split if standard pattern wasn't matched
  if (questionBlocks.length === 0) {
    questionBlocks = content
      .split(/(?:^|\n)#{1,4}\s+Q\d+/gi)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);
  }

  if (questionBlocks.length === 0) {
    throw new Error(
      'Format file Markdown tidak valid atau tidak memiliki soal. ' +
      'Pastikan menggunakan format ### Q1, ### Q2, dst.'
    );
  }

  const questions: QuizItem[] = questionBlocks.map((block, index) => {
    const rawLines = block.split('\n');
    const questionLines: string[] = [];
    const options: string[] = [];
    let correctIndex = 0;
    let hint = 'Baca kembali materi dengan seksama!';
    let isParsingOptions = false;

    for (let i = 0; i < rawLines.length; i++) {
      let line = rawLines[i].trim();
      if (!line) {
        if (!isParsingOptions && questionLines.length > 0) {
          questionLines.push('');
        }
        continue;
      }

      // Check for Checkbox Options:
      // Supports: - [x], - [X], * [x], * [X], + [x], 1. [x], a. [x]
      // Supports: - [ ], * [ ], + [ ], 1. [ ], a. [ ]
      const isCorrectOption = /^(?:[-*+]|\d+\.|\w\.)\s*\[[xX]\]/i.test(line);
      const isIncorrectOption = /^(?:[-*+]|\d+\.|\w\.)\s*\[\s*\]/i.test(line);

      // Check for Hint:
      // Supports: *Hint: ...*, _Hint: ..._, Hint: ..., *Petunjuk: ...*, Petunjuk: ...
      const isHint = /^[*_]?(?:Hint|Petunjuk|Clue)\s*:\s*[*_]?/i.test(line);

      if (isCorrectOption) {
        isParsingOptions = true;
        correctIndex = options.length;
        const optText = line
          .replace(/^(?:[-*+]|\d+\.|\w\.)\s*\[[xX]\]\s*/i, '')
          .replace(/^[*_`]+|[*_`]+$/g, '')
          .trim();
        options.push(optText);
      } else if (isIncorrectOption) {
        isParsingOptions = true;
        const optText = line
          .replace(/^(?:[-*+]|\d+\.|\w\.)\s*\[\s*\]\s*/i, '')
          .replace(/^[*_`]+|[*_`]+$/g, '')
          .trim();
        options.push(optText);
      } else if (isHint) {
        isParsingOptions = true;
        hint = line
          .replace(/^[*_]?(?:Hint|Petunjuk|Clue)\s*:\s*[*_]?/i, '')
          .replace(/[*_]+$/, '')
          .trim();
      } else if (!isParsingOptions) {
        // Multi-line question content (e.g. math number series, equations, problem context)
        // Clean markdown blockquote prefix '>' or backtick fence '```'
        if (line.startsWith('>')) {
          line = line.replace(/^>\s*/, '');
        }
        if (line.startsWith('```')) {
          continue; // skip code fence markers
        }
        questionLines.push(line);
      } else {
        // Option continuation or extra notes
        if (options.length > 0) {
          options[options.length - 1] += ' ' + line;
        }
      }
    }

    // Clean question text
    let questionText = questionLines.join('\n').trim();
    if (!questionText) {
      questionText = `Pertanyaan #${index + 1}`;
    }

    // Validate options count
    if (options.length < 2) {
      throw new Error(
        `Soal #${index + 1} ("${questionText.slice(0, 35)}...") tidak memiliki cukup pilihan jawaban (minimal 2 diperlukan).`
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
