import { LevelCounts, Level, Passage } from '../types';

/**
 * Client for the CEFR Texts API (FastAPI).
 * The exact JSON field names aren't fixed, so every response is normalized
 * defensively: we accept common aliases (text/content/body, title/name, etc.)
 * and both bare arrays and paginated `{ items: [...] }` envelopes.
 */

function pick<T = unknown>(obj: Record<string, unknown>, keys: string[]): T | undefined {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k] as T;
  }
  return undefined;
}

function countWords(text: string): number {
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}

function normalizePassage(raw: unknown, index: number): Passage | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  const text = pick<string>(o, ['text', 'content', 'body', 'passage', 'paragraph']);
  if (!text || typeof text !== 'string') return null;

  const id = String(pick<string | number>(o, ['id', '_id', 'uuid']) ?? `idx-${index}`);
  const level = (pick<string>(o, ['level', 'label', 'cefr', 'cefr_level', 'difficulty']) ?? '') as string;
  const topic = pick<string>(o, ['topic', 'category', 'subject', 'theme']);

  let title = pick<string>(o, ['title', 'name', 'heading']);
  if (!title) {
    // Derive a friendly title from the first few words.
    const words = text.trim().split(/\s+/).slice(0, 6).join(' ');
    title = words.length < text.trim().length ? `${words}…` : words;
  }

  return {
    id,
    level,
    title,
    text: text.trim(),
    topic,
    wordCount: (pick<number>(o, ['word_count', 'wordCount']) as number) ?? countWords(text),
  };
}

function extractList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>;
    for (const key of ['items', 'texts', 'data', 'results', 'passages']) {
      if (Array.isArray(o[key])) return o[key] as unknown[];
    }
  }
  return [];
}

export class CefrApi {
  constructor(private baseUrl: string) {}

  private url(path: string, params?: Record<string, string | number | undefined>): string {
    const base = this.baseUrl.replace(/\/+$/, '');
    const qs = params
      ? Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join('&')
      : '';
    return `${base}${path}${qs ? `?${qs}` : ''}`;
  }

  private async getJson(path: string, params?: Record<string, string | number | undefined>) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(this.url(path, params), {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`Request failed (${res.status}) for ${path}`);
      }
      return await res.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Per-level text counts from /levels. */
  async getLevelCounts(): Promise<LevelCounts> {
    const data = await this.getJson('/levels');
    const out: LevelCounts = {};
    if (data && typeof data === 'object') {
      const o = data as Record<string, unknown>;
      // Either { A1: 288, ... } or { levels: { A1: 288 } } or [{level, count}]
      const source = (o.levels && typeof o.levels === 'object' ? o.levels : o) as Record<
        string,
        unknown
      >;
      if (Array.isArray(data)) {
        for (const row of data as Record<string, unknown>[]) {
          const lvl = pick<string>(row, ['level', 'name']);
          const cnt = pick<number>(row, ['count', 'total', 'value']);
          if (lvl && typeof cnt === 'number') out[lvl] = cnt;
        }
      } else {
        for (const [k, v] of Object.entries(source)) {
          if (typeof v === 'number') out[k] = v;
        }
      }
    }
    return out;
  }

  /** List passages with optional level filter + pagination. */
  async getTexts(opts: {
    level?: Level | string;
    page?: number;
    limit?: number;
  } = {}): Promise<Passage[]> {
    const data = await this.getJson('/texts', {
      level: opts.level,
      page: opts.page,
      limit: opts.limit,
    });
    return extractList(data)
      .map((raw, i) => normalizePassage(raw, i))
      .filter((p): p is Passage => p !== null);
  }

  /** A single passage by id. */
  async getText(id: string): Promise<Passage | null> {
    const data = await this.getJson(`/texts/${encodeURIComponent(id)}`);
    return normalizePassage(data, 0);
  }

  /** Random passages, optionally for a level. */
  async getRandom(opts: { level?: Level | string; count?: number } = {}): Promise<Passage[]> {
    const data = await this.getJson('/random', { level: opts.level, count: opts.count });
    const list = extractList(data);
    if (list.length > 0) {
      return list.map((raw, i) => normalizePassage(raw, i)).filter((p): p is Passage => p !== null);
    }
    // /random may return a single object instead of a list.
    const single = normalizePassage(data, 0);
    return single ? [single] : [];
  }

  /** Quick connectivity/info probe against `/`. */
  async ping(): Promise<boolean> {
    try {
      await this.getJson('/');
      return true;
    } catch {
      return false;
    }
  }
}
