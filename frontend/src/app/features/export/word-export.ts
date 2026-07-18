import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

import { Meta, ReportResponse, ReportRow } from '../../core/models';

const NAVY = '003087';

function cell(text: string, options?: { bold?: boolean; fill?: string; color?: string }): TableCell {
  return new TableCell({
    shading: options?.fill ? { fill: options.fill } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: options?.bold ?? false,
            color: options?.color,
            size: 18,
            font: 'Arial',
          }),
        ],
      }),
    ],
  });
}

function heading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, color: NAVY, size: 28, font: 'Arial' })],
  });
}

function body(text: string, options?: { italic?: boolean; bold?: boolean }): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        italics: options?.italic ?? false,
        bold: options?.bold ?? false,
        size: 20,
        font: 'Arial',
      }),
    ],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 20, font: 'Arial' })],
  });
}

export async function exportWord(report: ReportResponse, meta: Meta): Promise<void> {
  const rows = report.rows;
  const priorityRows: ReportRow[] = [...rows].sort((a, b) => a.rank - b.rank);
  const orgName = report.assessment.orgName;
  const today = new Date().toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: 'C8C6B8' },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: 'C8C6B8' },
      left: { style: BorderStyle.SINGLE, size: 2, color: 'C8C6B8' },
      right: { style: BorderStyle.SINGLE, size: 2, color: 'C8C6B8' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'C8C6B8' },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'C8C6B8' },
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: ['Toepassing', 'Aanbevolen', 'Leverancier(s)', 'Haalbaar', 'Status', 'Fase'].map(
          (label) => cell(label, { bold: true, fill: NAVY, color: 'FFFFFF' }),
        ),
      }),
      ...rows.map(
        (row) =>
          new TableRow({
            children: [
              cell(row.app.name),
              cell(`Niveau ${row.app.recommendedLevel}`),
              cell(row.supplierNames.join(', ')),
              cell(
                row.compliance.achievableLevel !== null
                  ? `Niveau ${row.compliance.achievableLevel}`
                  : 'Onbekend',
              ),
              cell(row.statusLabel, {
                bold: true,
                color:
                  row.statusLabel === 'OK'
                    ? '1A7F37'
                    : row.statusLabel === 'GAP'
                      ? 'B3261E'
                      : '9A6700',
              }),
              cell(row.phase),
            ],
          }),
      ),
    ],
  });

  const recommendationBlocks = priorityRows.flatMap((row) => [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 80 },
      children: [new TextRun({ text: row.app.name, bold: true, color: NAVY, size: 24, font: 'Arial' })],
    }),
    body(
      `Aanbevolen niveau: ${row.app.recommendedLevel} (${meta.levelInfo[String(row.app.recommendedLevel)].name}) · ` +
        `Leverancier(s): ${row.supplierNames.join(', ')} · Status: ${row.statusLabel} · Fase: ${row.phase}`,
    ),
    ...(row.app.levelReason ? [body(`Motivering: ${row.app.levelReason}`, { italic: true })] : []),
    ...row.recommendations.map(bullet),
  ]);

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: 'CLOUD AND AI DEVELOPMENT ACT',
                size: 16,
                color: '5B6069',
                font: 'Arial',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'CADA Sovereignty Navigator — Rapportage',
                bold: true,
                size: 40,
                color: NAVY,
                font: 'Arial',
              }),
            ],
          }),
          body(`Organisatie: ${orgName}`),
          body(`Datum: ${today}`),
          body(`Aantal geanalyseerde toepassingen: ${rows.length}`),

          heading('1. Samenvatting van de analyse'),
          summaryTable,

          heading('2. Roadmap per fase'),
          ...[
            'Korte termijn (< 1 jaar)',
            'Middellang (1–2 jaar)',
            'Meerjarig (2+ jaar)',
            'Handmatig toetsen',
            'Borgen',
          ].flatMap((phase) => {
            const inPhase = priorityRows.filter((r) => r.phase === phase);
            if (inPhase.length === 0) return [];
            return [
              body(phase, { bold: true }),
              ...inPhase.map((r) => bullet(`${r.app.name} — niveau ${r.app.recommendedLevel}`)),
            ];
          }),

          heading('3. Aanbevelingen per toepassing'),
          ...recommendationBlocks,

          heading('4. Disclaimer'),
          body(
            'Dit rapport is indicatief. Raadpleeg altijd een juridisch adviseur voor bindende interpretatie van de CADA.',
            { italic: true },
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeName =
    orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'organisatie';
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `cada-rapport-${safeName}.docx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
