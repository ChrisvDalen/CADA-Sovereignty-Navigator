import * as XLSX from "xlsx";
import { DATA_TYPES, LEVEL_INFO, REGULATIONS } from "@/lib/cada";
import type { AssessmentDto } from "@/lib/types";
import { buildReportRows, prioritized } from "@/lib/report";

export function exportExcel(assessment: AssessmentDto) {
  const rows = prioritized(buildReportRows(assessment));

  const data = rows.map((row, i) => ({
    Prioriteit: i + 1,
    Toepassing: row.app.name,
    "Aanbevolen niveau": `Niveau ${row.app.recommendedLevel} — ${LEVEL_INFO[row.app.recommendedLevel].name}`,
    "Leverancier(s)": row.supplierNames.join(", "),
    "Haalbaar niveau":
      row.compliance.achievableLevel !== null
        ? `Niveau ${row.compliance.achievableLevel}`
        : "Onbekend",
    Status: row.statusLabel,
    Impact: row.impactLabel,
    "Kritieke infrastructuur": row.app.criticalInfra ? "Ja" : "Nee",
    "Type data": row.app.dataTypes
      .map((key) => DATA_TYPES.find((d) => d.key === key)?.label ?? key)
      .join("; "),
    Regelgeving: row.app.regulations
      .map((key) => REGULATIONS.find((r) => r.key === key)?.label ?? key)
      .join("; "),
    Aanbevelingen: row.recommendations.join(" "),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet["!cols"] = [
    { wch: 9 },
    { wch: 28 },
    { wch: 26 },
    { wch: 30 },
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 45 },
    { wch: 45 },
    { wch: 80 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "CADA-analyse");

  const infoSheet = XLSX.utils.aoa_to_sheet([
    ["CADA Sovereignty Navigator"],
    [],
    ["Organisatie", assessment.orgName],
    ["Datum", new Date().toLocaleDateString("nl-NL")],
    ["Aantal toepassingen", rows.length],
    [],
    [
      "Disclaimer",
      "Dit rapport is indicatief. Raadpleeg altijd een juridisch adviseur voor bindende interpretatie van de CADA.",
    ],
  ]);
  infoSheet["!cols"] = [{ wch: 22 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(workbook, infoSheet, "Toelichting");

  const safeName = assessment.orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  XLSX.writeFile(workbook, `cada-rapport-${safeName || "organisatie"}.xlsx`);
}
