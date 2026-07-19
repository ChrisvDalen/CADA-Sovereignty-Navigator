import { describe, expect, it } from 'vitest';

import { isVerificationStale } from './verification';

describe('isVerificationStale', () => {
  const now = new Date('2026-07-19T00:00:00Z');

  it('markeert een ontbrekende datum als verouderd', () => {
    expect(isVerificationStale(null, 12, now)).toBe(true);
  });

  it('markeert een verificatie ouder dan de drempel als verouderd', () => {
    expect(isVerificationStale('2025-01-01', 12, now)).toBe(true);
  });

  it('houdt een recente verificatie als geldig', () => {
    expect(isVerificationStale('2026-03-01', 12, now)).toBe(false);
  });

  it('behandelt een onleesbare datum als verouderd', () => {
    expect(isVerificationStale('geen-datum', 12, now)).toBe(true);
  });
});
