import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config';
import { Flashcard, ProgressStats, ReadPassage } from '../types';

export async function loadFlashcards(): Promise<Flashcard[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.flashcards);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveFlashcards(cards: Flashcard[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.flashcards, JSON.stringify(cards));
}

const DEFAULT_PROGRESS: ProgressStats = {
  passagesRead: 0,
  wordsSaved: 0,
  reviewsDone: 0,
  streak: 0,
};

export async function loadProgress(): Promise<ProgressStats> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.progress);
    if (!raw) return { ...DEFAULT_PROGRESS };
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export async function saveProgress(progress: ProgressStats): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
}

export async function loadApiBaseUrl(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.apiBaseUrl);
  } catch {
    return null;
  }
}

export async function saveApiBaseUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.apiBaseUrl, url);
}

export async function loadReadPassages(): Promise<ReadPassage[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.readPassages);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Ignore any legacy string[] entries from older versions.
    return parsed.filter((p): p is ReadPassage => p && typeof p === 'object' && 'id' in p);
  } catch {
    return [];
  }
}

export async function saveReadPassages(items: ReadPassage[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.readPassages, JSON.stringify(items));
}
