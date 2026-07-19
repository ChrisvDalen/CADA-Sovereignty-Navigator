import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { LocaleStore } from './i18n';

describe('LocaleStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [LocaleStore] });
  });

  it('gebruikt standaard Nederlands', () => {
    const store = TestBed.inject(LocaleStore);
    expect(store.lang()).toBe('nl');
    expect(store.t('common.signOut')).toBe('Afmelden');
  });

  it('wisselt van taal en onthoudt de keuze', () => {
    const store = TestBed.inject(LocaleStore);
    store.toggle();
    expect(store.lang()).toBe('en');
    expect(store.t('common.signOut')).toBe('Sign out');
    expect(localStorage.getItem('cada-lang')).toBe('en');
  });

  it('vult placeholders in', () => {
    const store = TestBed.inject(LocaleStore);
    expect(store.t('deadline.daysLeft', { days: 13 })).toBe('nog 13 dagen');
    store.set('en');
    expect(store.t('deadline.daysLeft', { days: 13 })).toBe('13 days left');
  });

  it('valt terug op de sleutel bij een onbekende vertaling', () => {
    const store = TestBed.inject(LocaleStore);
    expect(store.t('bestaat.niet')).toBe('bestaat.niet');
  });
});
