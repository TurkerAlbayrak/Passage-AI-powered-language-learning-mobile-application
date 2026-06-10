import { Platform } from 'react-native';

/**
 * Default base URL for the CEFR Texts API (FastAPI).
 *
 * IMPORTANT: a phone/emulator cannot reach your computer's "localhost".
 *  - Android emulator:  http://10.0.2.2:8000
 *  - iOS simulator:     http://localhost:8000
 *  - Physical device:   http://<your-computer-LAN-IP>:8000  (e.g. 192.168.1.20)
 *  - Deployed (Railway/Render/Fly): https://your-app.up.railway.app
 *
 * You can also change this at runtime from the in-app Settings screen.
 */
export const DEFAULT_API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

/** Free Dictionary API base (English). */
export const DICTIONARY_API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';

/** Topics shown in the browser. The CEFR API filters by level; topic is a hint
 * applied client-side (matched against passage title/text/topic when present). */
export const TOPICS = [
  { id: 'all', label: 'All', emoji: '✶' },
  { id: 'technology', label: 'Technology', emoji: '💡' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'health', label: 'Health', emoji: '🩺' },
  { id: 'science', label: 'Science', emoji: '🔬' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'history', label: 'History', emoji: '🏛️' },
  { id: 'food', label: 'Food', emoji: '🍲' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'culture', label: 'Culture', emoji: '🎭' },
  { id: 'business', label: 'Business', emoji: '📈' },
] as const;

export const STORAGE_KEYS = {
  apiBaseUrl: 'passage.apiBaseUrl',
  flashcards: 'passage.flashcards.v1',
  progress: 'passage.progress.v1',
  readPassages: 'passage.readPassages.v1',
};
