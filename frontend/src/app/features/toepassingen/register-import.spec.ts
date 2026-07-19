import { describe, expect, it } from 'vitest';

import { Meta } from '../../core/models';
import { detectColumns, mapRows } from './register-import';

const META: Meta = {
  dataTypes: [
    { key: 'persoonsgegevens', label: 'Persoonsgegevens (AVG)', hint: '' },
    { key: 'operationeel', label: 'Operationele / procesdata (niet-gevoelig)', hint: '' },
  ],
  regulations: [
    { key: 'avg', label: 'AVG / GDPR' },
    { key: 'geen', label: 'Geen specifieke regelgeving' },
  ],
  impactLevels: [
    { key: 'beperkt', label: 'Beperkt', description: '', weight: 1 },
    { key: 'ernstig', label: 'Ernstig', description: '', weight: 2 },
  ],
  knownSuppliers: ['Microsoft Azure', 'SURF'],
  otherSupplier: 'Anders',
  supplierData: {},
  supplierDetails: [],
  levelInfo: {},
};

describe('detectColumns', () => {
  it('herkent NL- en EN-kolomkoppen via synoniemen', () => {
    const columns = detectColumns(['Naam', 'Type data', 'Impact', 'Suppliers']);
    expect(columns.name).toBe('Naam');
    expect(columns.dataTypes).toBe('Type data');
    expect(columns.impactLevel).toBe('Impact');
    expect(columns.suppliers).toBe('Suppliers');
  });
});

describe('mapRows', () => {
  it('matcht labels op referentiesleutels en normaliseert booleans', () => {
    const rows = [
      {
        Toepassing: 'Zaaksysteem',
        'Type data': 'Persoonsgegevens (AVG)',
        Regelgeving: 'AVG / GDPR',
        Impact: 'Ernstig',
        'Kritieke infrastructuur': 'Ja',
        'AI-verwerking': 'nee',
        Leveranciers: 'Microsoft Azure',
      },
    ];
    const [mapped] = mapRows(rows, META);
    expect(mapped.payload.name).toBe('Zaaksysteem');
    expect(mapped.payload.dataTypes).toEqual(['persoonsgegevens']);
    expect(mapped.payload.regulations).toEqual(['avg']);
    expect(mapped.payload.impactLevel).toBe('ernstig');
    expect(mapped.payload.criticalInfra).toBe(true);
    expect(mapped.payload.aiProcessing).toBe(false);
    expect(mapped.payload.suppliers).toEqual(['Microsoft Azure']);
    expect(mapped.unknownSuppliers).toEqual([]);
  });

  it('splitst meerdere waarden en zet onbekende leveranciers onder Anders', () => {
    const rows = [
      {
        Naam: 'Datawarehouse',
        Data: 'Persoonsgegevens (AVG); Operationele / procesdata (niet-gevoelig)',
        Impact: 'Beperkt',
        Leverancier: 'SURF, Eigen datacenter',
      },
    ];
    const [mapped] = mapRows(rows, META);
    expect(mapped.payload.dataTypes).toEqual(['persoonsgegevens', 'operationeel']);
    expect(mapped.payload.suppliers).toEqual(['SURF', 'Anders']);
    expect(mapped.unknownSuppliers).toEqual(['Eigen datacenter']);
    expect(mapped.payload.supplierOther).toBe('Eigen datacenter');
  });
});
