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
  | 'background_select'
  | 'quiz_library'
  | 'boss_battle'
  | 'lab_infinite'
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
  userAnswers: Record<number, number>; // question index -> chosen option index
  isFinished: boolean;

  // Character
  character: CharacterGear;

  // Atmosphere & Audio Customization
  selectedBgmTrack: string;
  selectedBackground: string;

  // UI overlays
  showNotebookLMModal: boolean;
  showParentReport: boolean;
  showHowToPlayModal: boolean;

  // Actions
  setScreen: (screen: GameScreen) => void;
  loadQuizSession: (metadata: QuizMetadata, questions: QuizItem[]) => void;
  setStudentName: (name: string) => void;
  setCharacterGender: (gender: 'boy' | 'girl') => void;
  updateCharacterGear: (slot: keyof CharacterGear, itemValue: string) => void;
  setSelectedBgmTrack: (track: string) => void;
  setSelectedBackground: (bgUrl: string) => void;
  submitAnswer: (optionIndex: number) => { isCorrect: boolean; hint: string };
  nextQuestion: () => void;
  resetGame: () => void;
  setShowNotebookLMModal: (show: boolean) => void;
  setShowParentReport: (show: boolean) => void;
  setShowHowToPlayModal: (show: boolean) => void;
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
  userAnswers: {},
  isFinished: false,

  // Default character (Boy)
  character: {
    gender: 'boy',
  },

  // Atmosphere defaults
  selectedBgmTrack: 'momo_island',
  selectedBackground: '/backgrounds/library_sunlit.jpg',

  // UI
  showNotebookLMModal: false,
  showParentReport: false,
  showHowToPlayModal: false,

  // ─── Actions ──────────────────────────────────────────────────────────────

  setScreen: (screen) => set({ currentScreen: screen }),

  loadQuizSession: (metadata, questions) =>
    set({
      metadata,
      questions,
      currentQuestionIndex: 0,
      score: 0,
      correctAnswersCount: 0,
      userAnswers: {},
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

  setSelectedBgmTrack: (track) => set({ selectedBgmTrack: track }),
  setSelectedBackground: (bgUrl) => set({ selectedBackground: bgUrl }),

  submitAnswer: (optionIndex) => {
    const { questions, currentQuestionIndex, score, correctAnswersCount, userAnswers } = get();
    const currentQ = questions[currentQuestionIndex];
    const isCorrect = optionIndex === currentQ.correctIndex;
    
    const updatedAnswers = {
      ...userAnswers,
      [currentQuestionIndex]: optionIndex,
    };

    set({
      userAnswers: updatedAnswers,
      ...(isCorrect
        ? {
            score: score + 100,
            correctAnswersCount: correctAnswersCount + 1,
          }
        : {}),
    });

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
      userAnswers: {},
      isFinished: false,
      studentName: '',
      showParentReport: false,
      currentScreen: 'ingestion',
    }),

  setShowNotebookLMModal: (show) => set({ showNotebookLMModal: show }),
  setShowParentReport: (show) => set({ showParentReport: show }),
  setShowHowToPlayModal: (show) => set({ showHowToPlayModal: show }),
}));
