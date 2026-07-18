import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CadaApi } from './cada-api';
import { MetaStore } from './meta-store';
import { Meta } from './models';

const META: Meta = {
  dataTypes: [{ key: 'persoonsgegevens', label: 'Persoonsgegevens (AVG)', hint: '' }],
  regulations: [{ key: 'avg', label: 'AVG / GDPR' }],
  impactLevels: [{ key: 'ernstig', label: 'Ernstig', description: '', weight: 2 }],
  knownSuppliers: ['SURF'],
  otherSupplier: 'Anders',
  supplierData: { SURF: { maxLevel: 4, notes: 'Niveau 4-kandidaat.' } },
  supplierDetails: [
    {
      id: 's1',
      name: 'SURF',
      maxLevel: 4,
      notes: 'Niveau 4-kandidaat.',
      jurisdiction: 'Nederland',
      ownership: 'Coöperatie',
      certifications: 'ISO 27001, NEN 7510',
      lastVerified: '2026-07-01',
    },
  ],
  levelInfo: {
    '4': { name: 'Soevereiniteit', title: 'Niveau 4 — Soevereiniteit', description: '', requirements: [] },
  },
};

describe('MetaStore', () => {
  let store: MetaStore;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: CadaApi, useValue: { getMeta: vi.fn().mockResolvedValue(META) } }],
    });
    store = TestBed.inject(MetaStore);
    await store.load();
  });

  it('laadt de referentiedata één keer en cachet het resultaat', async () => {
    const api = TestBed.inject(CadaApi);
    await store.load();
    await store.load();
    expect(api.getMeta).toHaveBeenCalledTimes(1);
    expect(store.meta()).toEqual(META);
  });

  it('levert niveau-informatie met een veilige fallback', () => {
    expect(store.levelInfo(4).name).toBe('Soevereiniteit');
    expect(store.levelInfo(2).title).toBe('Niveau 2');
  });

  it('vertaalt impact-sleutels naar labels', () => {
    expect(store.impactLabel('ernstig')).toBe('Ernstig');
    expect(store.impactLabel('onbekend')).toBe('onbekend');
  });

  it('bouwt de herkomstregel uit jurisdictie, eigendom en certificeringen', () => {
    expect(store.supplierFacts('SURF')).toBe('Nederland · Coöperatie · ISO 27001, NEN 7510');
    expect(store.supplierFacts('Bestaat niet')).toBe('');
  });

  it('vervangt "Anders" door de eigen opgave in weergavenamen', () => {
    expect(store.supplierDisplayNames(['SURF', 'Anders'], 'Eigen Cloud')).toEqual([
      'SURF',
      'Eigen Cloud',
    ]);
    expect(store.supplierDisplayNames(['Anders'], '')).toEqual(['Anders']);
  });
});
