import { describe, expect, it } from 'vitest';

import { ReportRow } from './models';
import { groupByPhase, prioritized } from './report-utils';

function row(name: string, rank: number, phase: string): ReportRow {
  return {
    app: {
      id: name,
      name,
      dataTypes: ['operationeel'],
      regulations: ['geen'],
      impactLevel: 'minimaal',
      criticalInfra: false,
      aiProcessing: false,
      suppliers: ['SURF'],
      supplierOther: '',
      recommendedLevel: 1,
      levelReason: '',
    },
    compliance: { suppliers: [], achievableLevel: 4, status: 'ok', gap: 0 },
    recommendations: [],
    priority: 0,
    impactLabel: 'Minimaal',
    supplierNames: ['SURF'],
    statusLabel: 'OK',
    rank,
    phase,
  };
}

describe('prioritized', () => {
  it('sorteert op de server-side bepaalde rank', () => {
    const rows = [row('C', 3, 'Borgen'), row('A', 1, 'Borgen'), row('B', 2, 'Borgen')];
    expect(prioritized(rows).map((r) => r.app.name)).toEqual(['A', 'B', 'C']);
  });

  it('muteert de invoer niet', () => {
    const rows = [row('B', 2, 'Borgen'), row('A', 1, 'Borgen')];
    prioritized(rows);
    expect(rows.map((r) => r.app.name)).toEqual(['B', 'A']);
  });
});

describe('groupByPhase', () => {
  it('groepeert in uitvoeringsvolgorde en verbergt lege fasen', () => {
    const rows = [
      row('Archief', 1, 'Meerjarig (2+ jaar)'),
      row('Website', 3, 'Borgen'),
      row('DMS', 2, 'Korte termijn (< 1 jaar)'),
    ];

    const groups = groupByPhase(rows);

    expect(groups.map((g) => g.phase)).toEqual([
      'Korte termijn (< 1 jaar)',
      'Meerjarig (2+ jaar)',
      'Borgen',
    ]);
  });

  it('sorteert rijen binnen een fase op rank', () => {
    const rows = [row('B', 2, 'Borgen'), row('A', 1, 'Borgen')];
    expect(groupByPhase(rows)[0].rows.map((r) => r.app.name)).toEqual(['A', 'B']);
  });

  it('geeft een lege lijst voor een leeg rapport', () => {
    expect(groupByPhase([])).toEqual([]);
  });
});
