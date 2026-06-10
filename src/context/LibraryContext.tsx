import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Flashcard, ProgressStats, ReadPassage, WordDefinition } from '../types';
import {
  loadFlashcards,
  loadProgress,
  loadReadPassages,
  saveFlashcards,
  saveProgress,
  saveReadPassages,
} from '../storage';
import { initialSrsState, isDue, ReviewGrade, schedule } from '../utils/srs';
import { scheduleReviewReminder } from '../utils/notifications';

interface SaveWordInput {
  definition: WordDefinition;
  /** Which sense to store (index into definition.meanings). */
  meaningIndex: number;
  context: string;
  sourcePassageId?: string;
  sourcePassageTitle?: string;
  sourceLevel?: string;
}

interface LibraryContextValue {
  cards: Flashcard[];
  dueCards: Flashcard[];
  progress: ProgressStats;
  ready: boolean;
  savedWords: Set<string>;
  isWordSaved: (word: string) => boolean;
  saveWord: (input: SaveWordInput) => Promise<void>;
  removeCard: (id: string) => Promise<void>;
  reviewCard: (id: string, grade: ReviewGrade) => Promise<void>;
  readPassages: ReadPassage[];
  readPassageIds: Set<string>;
  isRead: (id: string) => boolean;
  toggleRead: (passage: { id: string; level: string; text: string; wordCount?: number }) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [progress, setProgress] = useState<ProgressStats>({
    passagesRead: 0,
    wordsSaved: 0,
    reviewsDone: 0,
    streak: 0,
  });
  const [readPassages, setReadPassages] = useState<ReadPassage[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const [c, p, r] = await Promise.all([
        loadFlashcards(),
        loadProgress(),
        loadReadPassages(),
      ]);
      setCards(c);
      setProgress(p);
      setReadPassages(r);
      setReady(true);
    })();
  }, []);

  const persistCards = useCallback(async (next: Flashcard[]) => {
    setCards(next);
    await saveFlashcards(next);
    const now = Date.now();
    const due = next.filter((c) => isDue(c, now));
    const nextDue = next.reduce((min, c) => Math.min(min, c.dueAt), Number.POSITIVE_INFINITY);
    if (next.length > 0 && Number.isFinite(nextDue)) {
      scheduleReviewReminder(nextDue, due.length).catch(() => undefined);
    }
  }, []);

  const savedWords = useMemo(
    () => new Set(cards.map((c) => c.word.toLowerCase())),
    [cards],
  );

  const isWordSaved = useCallback(
    (word: string) => savedWords.has(word.trim().toLowerCase()),
    [savedWords],
  );

  const saveWord = useCallback(
    async (input: SaveWordInput) => {
      const meaning = input.definition.meanings[input.meaningIndex] ?? input.definition.meanings[0];
      const firstDef = meaning?.definitions[0];
      const card: Flashcard = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        word: input.definition.word,
        definition: firstDef?.definition ?? '',
        partOfSpeech: meaning?.partOfSpeech,
        phonetic: input.definition.phonetic,
        audioUrl: input.definition.audioUrl,
        context: input.context,
        sourcePassageId: input.sourcePassageId,
        sourcePassageTitle: input.sourcePassageTitle,
        sourceLevel: input.sourceLevel,
        createdAt: Date.now(),
        ...initialSrsState(),
      };
      await persistCards([card, ...cards]);
      const nextProgress = { ...progress, wordsSaved: progress.wordsSaved + 1 };
      setProgress(nextProgress);
      await saveProgress(nextProgress);
    },
    [cards, persistCards, progress],
  );

  const removeCard = useCallback(
    async (id: string) => {
      await persistCards(cards.filter((c) => c.id !== id));
    },
    [cards, persistCards],
  );

  const reviewCard = useCallback(
    async (id: string, grade: ReviewGrade) => {
      const target = cards.find((c) => c.id === id);
      if (!target) return;
      const updated = schedule(target, grade);
      await persistCards(cards.map((c) => (c.id === id ? updated : c)));

      // Update streak + review count.
      const today = todayKey();
      let streak = progress.streak;
      if (progress.lastReviewDay !== today) {
        streak = progress.lastReviewDay === yesterdayKey() ? progress.streak + 1 : 1;
      }
      const nextProgress: ProgressStats = {
        ...progress,
        reviewsDone: progress.reviewsDone + 1,
        lastReviewDay: today,
        streak,
      };
      setProgress(nextProgress);
      await saveProgress(nextProgress);
    },
    [cards, persistCards, progress],
  );

  const readPassageIds = useMemo(
    () => new Set(readPassages.map((p) => p.id)),
    [readPassages],
  );

  const isRead = useCallback((id: string) => readPassageIds.has(id), [readPassageIds]);

  const toggleRead = useCallback(
    async (passage: { id: string; level: string; text: string; wordCount?: number }) => {
      let next: ReadPassage[];
      if (readPassageIds.has(passage.id)) {
        next = readPassages.filter((p) => p.id !== passage.id);
      } else {
        const record: ReadPassage = {
          id: passage.id,
          level: passage.level,
          preview: passage.text.slice(0, 140),
          wordCount: passage.wordCount,
          readAt: Date.now(),
        };
        next = [record, ...readPassages];
      }
      setReadPassages(next);
      await saveReadPassages(next);
    },
    [readPassages, readPassageIds],
  );

  const dueCards = useMemo(() => {
    const now = Date.now();
    return cards
      .filter((c) => isDue(c, now))
      .sort((a, b) => a.dueAt - b.dueAt);
  }, [cards]);

  const value = useMemo<LibraryContextValue>(
    () => ({
      cards,
      dueCards,
      progress,
      ready,
      savedWords,
      isWordSaved,
      saveWord,
      removeCard,
      reviewCard,
      readPassages,
      readPassageIds,
      isRead,
      toggleRead,
    }),
    [
      cards,
      dueCards,
      progress,
      ready,
      savedWords,
      isWordSaved,
      saveWord,
      removeCard,
      reviewCard,
      readPassages,
      readPassageIds,
      isRead,
      toggleRead,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
}
