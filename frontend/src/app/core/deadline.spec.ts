import { describe, expect, it } from 'vitest';

import { deadlineStatus } from './deadline';

describe('deadlineStatus', () => {
  it('telt de resterende dagen tot de deadline', () => {
    const status = deadlineStatus('2026-08-01', new Date('2026-07-19T12:00:00Z'));
    expect(status.days).toBe(13);
    expect(status.passed).toBe(false);
  });

  it('markeert een verstreken deadline', () => {
    const status = deadlineStatus('2026-08-01', new Date('2026-08-15T00:00:00Z'));
    expect(status.days).toBeLessThan(0);
    expect(status.passed).toBe(true);
  });

  it('geeft nul op de dag zelf', () => {
    const status = deadlineStatus('2026-08-01', new Date('2026-08-01T09:00:00Z'));
    expect(status.days).toBe(0);
    expect(status.passed).toBe(false);
  });
});
