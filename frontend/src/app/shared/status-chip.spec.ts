import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { StatusChip } from './status-chip';

describe('StatusChip', () => {
  function render(status: 'OK' | 'GAP' | 'ONBEKEND'): string {
    const fixture = TestBed.createComponent(StatusChip);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent?.trim() ?? '';
  }

  it('toont de OK-status', () => {
    expect(render('OK')).toContain('OK');
  });

  it('toont de GAP-status', () => {
    expect(render('GAP')).toContain('GAP');
  });

  it('toont ONBEKEND voor een handmatige toets', () => {
    expect(render('ONBEKEND')).toContain('ONBEKEND');
  });
});
