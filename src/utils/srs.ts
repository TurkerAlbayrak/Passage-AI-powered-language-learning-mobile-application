import { Flashcard } from '../types';

export const DAY_MS = 24 * 60 * 60 * 1000;

/** How a learner rated their recall during review. */
export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

/** Map a grade to the SM-2 quality score (0..5). */
const GRADE_QUALITY: Record<ReviewGrade, number> = {
  again: 2,
  hard: 3,
  good: 4,
  easy: 5,
};

/** Fresh SRS state for a newly saved card (due immediately). */
export function initialSrsState(): Pick<
  Flashcard,
  'repetitions' | 'easeFactor' | 'intervalDays' | 'dueAt'
> {
  return {
    repetitions: 0,
    easeFactor: 2.5,
    intervalDays: 0,
    dueAt: Date.now(),
  };
}

/**
 * Apply an SM-2 inspired update. Returns the new scheduling fields.
 * Intervals are scientifically spaced so reviews land near the point of
 * forgetting, turning passive reading into long-term acquisition.
 */
export function schedule(card: Flashcard, grade: ReviewGrade, now = Date.now()): Flashcard {
  const quality = GRADE_QUALITY[grade];
  let { repetitions, easeFactor, intervalDays } = card;

  if (quality < 3) {
    // Failed recall: reset the streak, see it again very soon.
    repetitions = 0;
    intervalDays = 0;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 3;
    else intervalDays = Math.round(intervalDays * easeFactor);

    // Adjust ease factor based on how the answer felt.
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;
  }

  // "Again" repeats in ~10 min; "hard" nudges down without full reset.
  const dueAt =
    grade === 'again'
      ? now + 10 * 60 * 1000
      : grade === 'hard' && intervalDays === 0
        ? now + 60 * 60 * 1000
        : now + intervalDays * DAY_MS;

  return {
    ...card,
    repetitions,
    easeFactor: Math.round(easeFactor * 100) / 100,
    intervalDays,
    dueAt,
    lastReviewedAt: now,
  };
}

export function isDue(card: Flashcard, now = Date.now()): boolean {
  return card.dueAt <= now;
}

/** Human-friendly preview of when a grade would schedule the next review. */
export function previewInterval(card: Flashcard, grade: ReviewGrade): string {
  const next = schedule(card, grade);
  const deltaMs = next.dueAt - Date.now();
  if (deltaMs < 60 * 1000) return 'now';
  if (deltaMs < 60 * 60 * 1000) return `${Math.round(deltaMs / (60 * 1000))} min`;
  if (deltaMs < DAY_MS) return `${Math.round(deltaMs / (60 * 60 * 1000))} h`;
  const days = Math.round(deltaMs / DAY_MS);
  if (days < 30) return `${days} d`;
  if (days < 365) return `${Math.round(days / 30)} mo`;
  return `${Math.round(days / 365)} yr`;
}
