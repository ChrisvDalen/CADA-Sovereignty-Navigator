"use client";

import { useState } from "react";
import type { AssessmentDto } from "@/lib/types";

export function ExportPanel({ assessment }: { assessment: AssessmentDto }) {
  const [busy, setBusy] = useState<"pdf" | "excel" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const disabled = assessment.applications.length === 0;

  async function handlePdf() {
    if (busy || disabled) return;
    setBusy("pdf");
    setError(null);
    try {
      const { exportPdf } = await import("@/lib/export/pdf");
      exportPdf(assessment);
    } catch {
      setError("Het PDF-rapport kon niet worden gegenereerd.");
    } finally {
      setBusy(null);
    }
  }

  async function handleExcel() {
    if (busy || disabled) return;
    setBusy("excel");
    setError(null);
    try {
      const { exportExcel } = await import("@/lib/export/excel");
      exportExcel(assessment);
    } catch {
      setError("Het Excel-bestand kon niet worden gegenereerd.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="flex flex-col border border-line bg-card p-6">
        <p className="font-[family-name:var(--font-mono)] text-xs font-medium text-navy-600">
          .PDF
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-serif)] text-xl font-semibold text-ink">
          Rapport als PDF
        </h2>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
          Professioneel opgemaakt rapport met voorpagina, inhoudsopgave,
          samenvattingstabel, uitleg per CADA-niveau, prioriteitenmatrix en
          aanbevelingen. Geschikt om te delen met bestuur en toezichthouders.
        </p>
        <button
          type="button"
          onClick={handlePdf}
          disabled={disabled || busy !== null}
          className="mt-5 w-full border border-navy-600 bg-navy-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:cursor-not-allowed disabled:border-line disabled:bg-paper disabled:text-ink-faint"
        >
          {busy === "pdf" ? "PDF wordt gegenereerd…" : "PDF exporteren"}
        </button>
      </div>

      <div className="flex flex-col border border-line bg-card p-6">
        <p className="font-[family-name:var(--font-mono)] text-xs font-medium text-navy-600">
          .XLSX
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-serif)] text-xl font-semibold text-ink">
          Gegevens als Excel
        </h2>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
          Alle toepassingen, niveaus, leveranciers en aanbevelingen in één
          tabel (één rij per toepassing), gesorteerd op prioriteit. Geschikt
          voor eigen analyses en projectplanning.
        </p>
        <button
          type="button"
          onClick={handleExcel}
          disabled={disabled || busy !== null}
          className="mt-5 w-full border border-navy-600 bg-card px-4 py-2.5 text-sm font-semibold text-navy-600 transition-colors hover:bg-navy-50 disabled:cursor-not-allowed disabled:border-line disabled:text-ink-faint"
        >
          {busy === "excel" ? "Excel wordt gegenereerd…" : "Excel exporteren"}
        </button>
      </div>

      {error && (
        <p className="border border-alert/30 bg-alert-bg px-3 py-2 text-sm text-alert md:col-span-2">
          {error}
        </p>
      )}
      {disabled && (
        <p className="text-sm text-ink-muted md:col-span-2">
          Voeg eerst minimaal één toepassing toe om te kunnen exporteren.
        </p>
      )}
    </div>
  );
}
