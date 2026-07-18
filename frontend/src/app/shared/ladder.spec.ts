import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { Ladder } from './ladder';

describe('Ladder', () => {
  function render(level: 1 | 2 | 3 | 4) {
    const fixture = TestBed.createComponent(Ladder);
    fixture.componentRef.setInput('level', level);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('toont vier balken', () => {
    expect(render(2).querySelectorAll('.ladder > i')).toHaveLength(4);
  });

  it('vult goud tot en met het niveau en laat de rest leeg', () => {
    const bars = Array.from(render(3).querySelectorAll('.ladder > i'));
    expect(bars.map((bar) => bar.className)).toEqual(['vol', 'vol', 'vol', 'leeg']);
  });

  it('vult alle balken op niveau 4', () => {
    const bars = Array.from(render(4).querySelectorAll('.ladder > i'));
    expect(bars.every((bar) => bar.classList.contains('vol'))).toBe(true);
  });
});
