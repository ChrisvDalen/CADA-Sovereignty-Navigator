import { ReportRow } from './models';

/** Rijen in prioriteitsvolgorde (rank is server-side bepaald). */
export function prioritized(rows: ReportRow[]): ReportRow[] {
  return [...rows].sort((a, b) => a.rank - b.rank);
}

/** Roadmapfasen in uitvoeringsvolgorde. */
export const PHASE_ORDER = [
  'Korte termijn (< 1 jaar)',
  'Middellang (1–2 jaar)',
  'Meerjarig (2+ jaar)',
  'Handmatig toetsen',
  'Borgen',
] as const;

export interface PhaseGroup {
  phase: string;
  rows: ReportRow[];
}

/** Groepeert rijen per roadmapfase; lege fasen worden weggelaten. */
export function groupByPhase(rows: ReportRow[]): PhaseGroup[] {
  const sorted = prioritized(rows);
  return PHASE_ORDER.map((phase) => ({
    phase,
    rows: sorted.filter((row) => row.phase === phase),
  })).filter((group) => group.rows.length > 0);
}
