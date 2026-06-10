/** A single rendered token: either a tappable word or inert whitespace/punctuation. */
export interface Token {
  text: string;
  isWord: boolean;
  /** Index into the sentences array for the sentence containing this token. */
  sentenceIndex: number;
}

export interface TokenizedText {
  tokens: Token[];
  sentences: string[];
}

const SENTENCE_SPLIT = /[^.!?…]+[.!?…]*\s*/g;

/** Split text into sentences (best-effort). */
export function splitSentences(text: string): string[] {
  const matches = text.match(SENTENCE_SPLIT);
  if (!matches) return text.trim() ? [text.trim()] : [];
  return matches.map((s) => s.trim()).filter(Boolean);
}

/**
 * Tokenize a passage for rendering. Words become tappable; everything else
 * (spaces, punctuation, newlines) is preserved so the text reads naturally.
 * Each token knows which sentence it belongs to, enabling context-aware saving.
 */
export function tokenize(text: string): TokenizedText {
  const sentences = splitSentences(text);

  // Build a map from character offset -> sentence index.
  const sentenceBounds: { start: number; end: number; index: number }[] = [];
  let cursor = 0;
  sentences.forEach((sentence, index) => {
    const found = text.indexOf(sentence, cursor);
    const start = found === -1 ? cursor : found;
    const end = start + sentence.length;
    sentenceBounds.push({ start, end, index });
    cursor = end;
  });

  const sentenceAt = (offset: number): number => {
    for (const b of sentenceBounds) {
      if (offset >= b.start && offset < b.end) return b.index;
    }
    return sentenceBounds.length ? sentenceBounds[sentenceBounds.length - 1].index : 0;
  };

  const tokens: Token[] = [];
  // Words contain letters/numbers/apostrophes/hyphens; split on the gaps.
  const wordRegex = /[\p{L}\p{N}][\p{L}\p{N}'-]*/gu;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = wordRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const gap = text.slice(lastIndex, match.index);
      tokens.push({ text: gap, isWord: false, sentenceIndex: sentenceAt(lastIndex) });
    }
    tokens.push({ text: match[0], isWord: true, sentenceIndex: sentenceAt(match.index) });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    tokens.push({ text: text.slice(lastIndex), isWord: false, sentenceIndex: sentenceAt(lastIndex) });
  }

  return { tokens, sentences };
}
