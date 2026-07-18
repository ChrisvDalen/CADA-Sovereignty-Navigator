import * as XLSX from 'xlsx';

import { Meta, ReportResponse } from '../../core/models';

export function exportExcel(report: ReportResponse, meta: Meta) {
  const rows = [...report.rows].sort((a, b) => a.rank - b.rank);
  const orgName = report.assessment.orgName;

  const data = rows.map((row, i) => ({
    Prioriteit: i + 1,
    Toepassing: row.app.name,
    'Aanbevolen niveau': `Niveau ${row.app.recommendedLevel} — ${meta.levelInfo[String(row.app.recommendedLevel)].name}`,
    'Leverancier(s)': row.supplierNames.join(', '),
    'Haalbaar niveau':
      row.compliance.achievableLevel !== null ? `Niveau ${row.compliance.achievableLevel}` : 'Onbekend',
    Status: row.statusLabel,
    Fase: row.phase,
    'Motivering niveau': row.app.levelReason,
    Impact: row.impactLabel,
    'Kritieke infrastructuur': row.app.criticalInfra ? 'Ja' : 'Nee',
    'AI-verwerking': row.app.aiProcessing ? 'Ja' : 'Nee',
    'Type data': row.app.dataTypes
      .map((key) => meta.dataTypes.find((d) => d.key === key)?.label ?? key)
      .join('; '),
    Regelgeving: row.app.regulations
      .map((key) => meta.regulations.find((r) => r.key === key)?.label ?? key)
      .join('; '),
    Aanbevelingen: row.recommendations.join(' '),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 9 },
    { wch: 28 },
    { wch: 26 },
    { wch: 30 },
    { wch: 14 },
    { wch: 10 },
    { wch: 24 },
    { wch: 50 },
    { wch: 10 },
    { wch: 12 },
    { wch: 14 },
    { wch: 45 },
    { wch: 45 },
    { wch: 80 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'CADA-analyse');

  const infoSheet = XLSX.utils.aoa_to_sheet([
    ['CADA Sovereignty Navigator'],
    [],
    ['Organisatie', orgName],
    ['Datum', new Date().toLocaleDateString('nl-NL')],
    ['Aantal toepassingen', rows.length],
    [],
    [
      'Disclaimer',
      'Dit rapport is indicatief. Raadpleeg altijd een juridisch adviseur voor bindende interpretatie van de CADA.',
    ],
  ]);
  infoSheet['!cols'] = [{ wch: 22 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(workbook, infoSheet, 'Toelichting');

  const safeName = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  XLSX.writeFile(workbook, `cada-rapport-${safeName || 'organisatie'}.xlsx`);
}
