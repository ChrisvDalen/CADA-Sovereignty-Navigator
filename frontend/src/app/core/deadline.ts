/** De CADA is van kracht per 1 augustus 2026. */
export const CADA_DEADLINE = '2026-08-01';

export interface DeadlineStatus {
  /** Aantal hele dagen tot de deadline; negatief als de datum verstreken is. */
  days: number;
  passed: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Hele dagen tussen nu en de deadline (op dagniveau, tijd genegeerd). */
export function deadlineStatus(
  deadline: string = CADA_DEADLINE,
  now: Date = new Date(),
): DeadlineStatus {
  const target = Date.parse(deadline + 'T00:00:00Z');
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.round((target - today) / MS_PER_DAY);
  return { days, passed: days < 0 };
}
