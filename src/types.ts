export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/** Normalized passage shape used throughout the app. */
export interface Passage {
  id: string;
  level: Level | string;
  title: string;
  text: string;
  topic?: string;
  wordCount?: number;
}

/** Per-level counts returned by /levels. */
export type LevelCounts = Partial<Record<Level, number>> & Record<string, number>;

/** A definition entry returned from the Free Dictionary API (normalized). */
export interface WordDefinition {
  word: string;
  phonetic?: string;
  audioUrl?: string;
  meanings: {
    partOfSpeech: string;
    definitions: { definition: string; example?: string }[];
  }[];
}

/** A saved vocabulary card with the sentence it came from (context-aware). */
export interface Flashcard {
  id: string;
  word: string;
  definition: string;
  partOfSpeech?: string;
  phonetic?: string;
  audioUrl?: string;
  /** The full sentence in which the word originally appeared. */
  context: string;
  /** Source passage metadata, if saved while reading. */
  sourcePassageId?: string;
  sourcePassageTitle?: string;
  sourceLevel?: string;
  createdAt: number;

  // --- Spaced repetition state (SM-2 inspired) ---
  /** Consecutive successful recalls. */
  repetitions: number;
  /** Ease factor controlling how fast intervals grow. */
  easeFactor: number;
  /** Current interval in days. */
  intervalDays: number;
  /** Epoch ms of the next scheduled review. */
  dueAt: number;
  /** Epoch ms of the last review, if any. */
  lastReviewedAt?: number;
}

/** A passage the user has marked as read (kept so it can be reopened). */
export interface ReadPassage {
  id: string;
  level: string;
  preview: string;
  wordCount?: number;
  readAt: number;
}

/** Lightweight progress counters for a sense of momentum (free-tier). */
export interface ProgressStats {
  passagesRead: number;
  wordsSaved: number;
  reviewsDone: number;
  lastReviewDay?: string; // YYYY-MM-DD
  streak: number;
}
