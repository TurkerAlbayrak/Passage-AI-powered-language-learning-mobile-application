import { DICTIONARY_API_BASE } from '../config';
import { WordDefinition } from '../types';

/** Strip surrounding punctuation and lowercase a tapped token. */
export function cleanWord(token: string): string {
  return token
    .replace(/^[^\p{L}\p{N}'-]+/u, '')
    .replace(/[^\p{L}\p{N}'-]+$/u, '')
    .toLowerCase();
}

interface RawPhonetic {
  text?: string;
  audio?: string;
}
interface RawDefinition {
  definition?: string;
  example?: string;
}
interface RawMeaning {
  partOfSpeech?: string;
  definitions?: RawDefinition[];
}
interface RawEntry {
  word?: string;
  phonetic?: string;
  phonetics?: RawPhonetic[];
  meanings?: RawMeaning[];
}

export async function lookupWord(word: string): Promise<WordDefinition> {
  const clean = cleanWord(word);
  if (!clean) throw new Error('No word to look up.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  let res: Response;
  try {
    res = await fetch(`${DICTIONARY_API_BASE}/${encodeURIComponent(clean)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 404) {
    throw new Error(`No definition found for "${clean}".`);
  }
  if (!res.ok) {
    throw new Error('Dictionary lookup failed. Check your connection.');
  }

  const data = (await res.json()) as RawEntry[];
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No definition found for "${clean}".`);
  }

  const entry = data[0];
  const phonetic =
    entry.phonetic || entry.phonetics?.find((p) => p.text)?.text || undefined;
  const audioUrl = entry.phonetics?.find((p) => p.audio && p.audio.length > 0)?.audio || undefined;

  const meanings = (entry.meanings ?? [])
    .map((m) => ({
      partOfSpeech: m.partOfSpeech ?? '',
      definitions: (m.definitions ?? [])
        .filter((d) => !!d.definition)
        .slice(0, 3)
        .map((d) => ({ definition: d.definition as string, example: d.example })),
    }))
    .filter((m) => m.definitions.length > 0);

  if (meanings.length === 0) {
    throw new Error(`No definition found for "${clean}".`);
  }

  return {
    word: entry.word || clean,
    phonetic,
    audioUrl: audioUrl?.startsWith('//') ? `https:${audioUrl}` : audioUrl,
    meanings,
  };
}
