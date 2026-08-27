import { create } from 'zustand';

// ─── Data Types ───────────────────────────────────────────────────────────────

export interface QuizItem {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  hint: string;
}

export interface QuizMetadata {
  title: string;
  grade: number;
  subject: string;
  author: string;
}

export interface CharacterGear {
  gender: 'boy' | 'girl';
}

// ─── Screen Flow ──────────────────────────────────────────────────────────────

export type GameScreen =
  | 'ingestion'
  | 'character'
  | 'quiz_library'
  | 'antigravity'
  | 'certificate';

// ─── State Shape ──────────────────────────────────────────────────────────────

export interface GameState {
  // Navigation
  currentScreen: GameScreen;

  // Session data
  metadata: QuizMetadata | null;
  questions: QuizItem[];
  currentQuestionIndex: number;
  studentName: string;
  score: number;
  correctAnswersCount: number;
  isFinished: boolean;

  // Character
  character: CharacterGear;

  // UI overlays
  showNotebookLMModal: boolean;

  // Actions
  setScreen: (screen: GameScreen) => void;
  loadQuizSession: (metadata: QuizMetadata, questions: QuizItem[]) => void;
  setStudentName: (name: string) => void;
  setCharacterGender: (gender: 'boy' | 'girl') => void;
  updateCharacterGear: (slot: keyof CharacterGear, itemValue: string) => void;
  submitAnswer: (optionIndex: number) => { isCorrect: boolean; hint: string };
  nextQuestion: () => void;
  resetGame: () => void;
  setShowNotebookLMModal: (show: boolean) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameState>((set, get) => ({
  // Navigation
  currentScreen: 'ingestion',

  // Session defaults
  metadata: null,
  questions: [],
  currentQuestionIndex: 0,
  studentName: '',
  score: 0,
  correctAnswersCount: 0,
  isFinished: false,

  // Default character (Boy)
  character: {
    gender: 'boy',
  },

  // UI
  showNotebookLMModal: false,

  // ─── Actions ──────────────────────────────────────────────────────────────

  setScreen: (screen) => set({ currentScreen: screen }),

  loadQuizSession: (metadata, questions) =>
    set({
      metadata,
      questions,
      currentQuestionIndex: 0,
      score: 0,
      correctAnswersCount: 0,
      isFinished: false,
      currentScreen: 'character',
    }),

  setStudentName: (name) => set({ studentName: name }),

  setCharacterGender: (gender) =>
    set({
      character: { gender },
    }),

  updateCharacterGear: (_slot, itemValue) =>
    set({
      character: { gender: itemValue === 'girl' ? 'girl' : 'boy' },
    }),

  submitAnswer: (optionIndex) => {
    const { questions, currentQuestionIndex, score, correctAnswersCount } = get();
    const currentQ = questions[currentQuestionIndex];
    const isCorrect = optionIndex === currentQ.correctIndex;
    if (isCorrect) {
      set({
        score: score + 100,
        correctAnswersCount: correctAnswersCount + 1,
      });
    }
    return { isCorrect, hint: currentQ.hint };
  },

  nextQuestion: () => {
    const { questions, currentQuestionIndex } = get();
    if (currentQuestionIndex + 1 < questions.length) {
      const nextIndex = currentQuestionIndex + 1;
      // Stay 100% on quiz_library for the full quiz session
      set({ currentQuestionIndex: nextIndex, currentScreen: 'quiz_library' });
    } else {
      set({ isFinished: true, currentScreen: 'antigravity' });
    }
  },

  resetGame: () =>
    set({
      metadata: null,
      questions: [],
      currentQuestionIndex: 0,
      score: 0,
      correctAnswersCount: 0,
      isFinished: false,
      studentName: '',
      currentScreen: 'ingestion',
    }),

  setShowNotebookLMModal: (show) => set({ showNotebookLMModal: show }),
}));
