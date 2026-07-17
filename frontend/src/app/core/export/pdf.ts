import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { LEVEL_INFO, type CadaLevel } from "../cada";
import type { AssessmentDto } from "../types";
import { buildReportRows, prioritized } from "../report";

const NAVY: [number, number, number] = [0, 48, 135];
const INK: [number, number, number] = [27, 30, 36];
const MUTED: [number, number, number] = [91, 96, 105];
const LINE: [number, number, number] = [200, 198, 184];

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - 2 * MARGIN;

function formatDate(date: Date): string {
  return date.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

class PdfWriter {
  doc: jsPDF;
  y = MARGIN;

  constructor() {
    this.doc = new jsPDF({ unit: "mm", format: "a4" });
  }

  ensureSpace(height: number) {
    if (this.y + height > PAGE_H - MARGIN) {
      this.doc.addPage();
      this.y = MARGIN;
    }
  }

  heading(text: string, size = 16) {
    this.ensureSpace(size * 0.6 + 8);
    this.doc.setFont("times", "bold");
    this.doc.setFontSize(size);
    this.doc.setTextColor(...NAVY);
    this.doc.text(text, MARGIN, this.y);
    this.y += size * 0.5 + 4;
  }

  paragraph(text: string, options?: { size?: number; color?: [number, number, number]; style?: "normal" | "bold" | "italic" }) {
    const size = options?.size ?? 10;
    this.doc.setFont("helvetica", options?.style ?? "normal");
    this.doc.setFontSize(size);
    this.doc.setTextColor(...(options?.color ?? INK));
    const lines = this.doc.splitTextToSize(text, CONTENT_W) as string[];
    const lineHeight = size * 0.45;
    for (const line of lines) {
      this.ensureSpace(lineHeight);
      this.doc.text(line, MARGIN, this.y);
      this.y += lineHeight;
    }
    this.y += 2;
  }

  bullet(text: string, indent = 6) {
    const size = 10;
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(size);
    this.doc.setTextColor(...INK);
    const lines = this.doc.splitTextToSize(text, CONTENT_W - indent) as string[];
    const lineHeight = size * 0.45;
    lines.forEach((line, i) => {
      this.ensureSpace(lineHeight);
      if (i === 0) {
        this.doc.setTextColor(...NAVY);
        this.doc.text("—", MARGIN, this.y);
        this.doc.setTextColor(...INK);
      }
      this.doc.text(line, MARGIN + indent, this.y);
      this.y += lineHeight;
    });
    this.y += 1.5;
  }

  divider() {
    this.ensureSpace(6);
    this.doc.setDrawColor(...LINE);
    this.doc.setLineWidth(0.2);
    this.doc.line(MARGIN, this.y, PAGE_W - MARGIN, this.y);
    this.y += 6;
  }

  space(mm: number) {
    this.y += mm;
  }
}

export function exportPdf(assessment: AssessmentDto) {
  const writer = new PdfWriter();
  const { doc } = writer;
  const rows = buildReportRows(assessment);
  const priorityRows = prioritized(rows);
  const today = formatDate(new Date());

  /* ── Voorpagina ─────────────────────────────────────────────── */
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  // Logo-placeholder Sopra Steria
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.rect(MARGIN, MARGIN, 58, 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("SOPRA STERIA", MARGIN + 29, MARGIN + 9.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("CLOUD AND AI DEVELOPMENT ACT", MARGIN, 110);

  doc.setFont("times", "bold");
  doc.setFontSize(30);
  doc.text("CADA Sovereignty Navigator", MARGIN, 124);
  doc.setFont("times", "italic");
  doc.setFontSize(16);
  doc.text("Rapportage soevereiniteitsniveaus en compliance-roadmap", MARGIN, 134);

  doc.setDrawColor(255, 255, 255);
  doc.line(MARGIN, 150, PAGE_W - MARGIN, 150);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Organisatie: ${assessment.orgName}`, MARGIN, 160);
  doc.text(`Datum: ${today}`, MARGIN, 168);
  doc.text(
    `Aantal geanalyseerde toepassingen: ${rows.length}`,
    MARGIN,
    176
  );

  doc.setFontSize(8);
  doc.text(
    "Dit rapport is indicatief. Raadpleeg altijd een juridisch adviseur voor bindende interpretatie van de CADA.",
    MARGIN,
    PAGE_H - MARGIN,
    { maxWidth: CONTENT_W }
  );

  /* ── Inhoudsopgave ──────────────────────────────────────────── */
  doc.addPage();
  writer.y = MARGIN + 5;
  writer.heading("Inhoudsopgave", 18);
  writer.space(4);
  const toc = [
    "1.  Samenvatting van de analyse",
    "2.  De vier CADA-soevereiniteitsniveaus",
    "3.  Prioriteitenmatrix",
    "4.  Aanbevelingen per toepassing",
    "5.  Disclaimer en vervolg",
  ];
  toc.forEach((item) => {
    writer.paragraph(item, { size: 11 });
    writer.space(1);
  });

  /* ── 1. Samenvatting ────────────────────────────────────────── */
  doc.addPage();
  writer.y = MARGIN + 5;
  writer.heading("1. Samenvatting van de analyse", 15);
  writer.paragraph(
    `Voor ${assessment.orgName} zijn ${rows.length} cloudtoepassing(en) geprofileerd op datatype, toepasselijke regelgeving, impact en leveranciers. De tabel hieronder toont per toepassing het aanbevolen CADA-niveau, het met de huidige leverancier(s) haalbare niveau en de compliance-status.`
  );
  writer.space(2);

  autoTable(doc, {
    startY: writer.y,
    margin: { left: MARGIN, right: MARGIN },
    head: [
      [
        "Toepassing",
        "Aanbevolen",
        "Leverancier(s)",
        "Haalbaar",
        "Status",
      ],
    ],
    body: rows.map((row) => [
      row.app.name,
      `Niveau ${row.app.recommendedLevel}`,
      row.supplierNames.join(", "),
      row.compliance.achievableLevel !== null
        ? `Niveau ${row.compliance.achievableLevel}`
        : "Onbekend",
      row.statusLabel,
    ]),
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: INK,
      lineColor: LINE,
      lineWidth: 0.2,
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 4) {
        const value = String(data.cell.raw);
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor =
          value === "OK"
            ? [26, 127, 55]
            : value === "GAP"
              ? [179, 38, 30]
              : [154, 103, 0];
      }
    },
  });
  writer.y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 10;

  /* ── 2. Uitleg per niveau ───────────────────────────────────── */
  doc.addPage();
  writer.y = MARGIN + 5;
  writer.heading("2. De vier CADA-soevereiniteitsniveaus", 15);
  writer.paragraph(
    "De Cloud and AI Development Act introduceert vier oplopende soevereiniteitsniveaus voor cloudgebruik door overheidsinstanties. Elk niveau omvat de eisen van de onderliggende niveaus."
  );
  writer.space(2);

  ([1, 2, 3, 4] as CadaLevel[]).forEach((level) => {
    const info = LEVEL_INFO[level];
    writer.ensureSpace(30);
    writer.heading(info.title, 12);
    writer.paragraph(info.description);
    info.requirements.forEach((req) => writer.bullet(req));
    writer.space(3);
  });

  /* ── 3. Prioriteitenmatrix ──────────────────────────────────── */
  doc.addPage();
  writer.y = MARGIN + 5;
  writer.heading("3. Prioriteitenmatrix", 15);
  writer.paragraph(
    "Toepassingen gesorteerd op risico: de combinatie van de hoogste impact en de grootste kloof tussen het aanbevolen en het haalbare niveau staat bovenaan."
  );
  writer.space(2);

  autoTable(doc, {
    startY: writer.y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["#", "Toepassing", "Impact", "Gap", "Status"]],
    body: priorityRows.map((row, i) => [
      String(i + 1),
      row.app.name,
      row.impactLabel,
      row.compliance.gap > 0 ? `${row.compliance.gap} niveau(s)` : "Geen",
      row.statusLabel,
    ]),
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: INK,
      lineColor: LINE,
      lineWidth: 0.2,
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
  });
  writer.y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 10;

  /* ── 4. Aanbevelingen ───────────────────────────────────────── */
  doc.addPage();
  writer.y = MARGIN + 5;
  writer.heading("4. Aanbevelingen per toepassing", 15);
  writer.space(2);

  priorityRows.forEach((row) => {
    writer.ensureSpace(28);
    writer.heading(row.app.name, 12);
    writer.paragraph(
      `Aanbevolen niveau: ${row.app.recommendedLevel} (${LEVEL_INFO[row.app.recommendedLevel].name}) · Leverancier(s): ${row.supplierNames.join(", ")} · Status: ${row.statusLabel}`,
      { size: 9, color: MUTED }
    );
    row.recommendations.forEach((advies) => writer.bullet(advies));
    writer.divider();
  });

  /* ── 5. Disclaimer en vervolg ───────────────────────────────── */
  writer.ensureSpace(70);
  writer.heading("5. Disclaimer en vervolg", 15);
  writer.paragraph(
    "Dit rapport is indicatief. Raadpleeg altijd een juridisch adviseur voor bindende interpretatie van de CADA.",
    { style: "italic" }
  );
  writer.space(2);
  writer.paragraph(
    "Wilt u hulp bij de implementatie van deze aanbevelingen? Sopra Steria begeleidt overheidsinstanties bij CADA-compliance: van risicoanalyse en leveranciersselectie tot migratie en certificering. Neem contact op via www.soprasteria.nl/contact."
  );

  /* ── Paginanummers ──────────────────────────────────────────── */
  const pageCount = doc.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `CADA Sovereignty Navigator · ${assessment.orgName} · ${today}`,
      MARGIN,
      PAGE_H - 10
    );
    doc.text(`Pagina ${i} van ${pageCount}`, PAGE_W - MARGIN, PAGE_H - 10, {
      align: "right",
    });
  }

  const safeName = assessment.orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  doc.save(`cada-rapport-${safeName || "organisatie"}.pdf`);
}
