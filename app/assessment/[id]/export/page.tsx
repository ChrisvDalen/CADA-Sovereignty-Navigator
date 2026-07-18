import { notFound } from "next/navigation";
import { getAssessment } from "@/lib/get-assessment";
import { WizardShell } from "@/components/WizardShell";
import { StepNav } from "@/components/StepNav";
import { ExportPanel } from "@/components/ExportPanel";

export const dynamic = "force-dynamic";

export default async function ExportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assessment = await getAssessment(id);
  if (!assessment) notFound();

  return (
    <WizardShell
      assessmentId={assessment.id}
      orgName={assessment.orgName}
      currentStep={4}
    >
      <header className="mb-8 max-w-3xl">
        <p className="eyebrow">Module 4 · Exporteren</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
          Exporteer uw rapportage
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
          Download het volledige gap-rapport voor {assessment.orgName} als PDF of
          exporteer de onderliggende gegevens naar Excel. Beide bestanden worden
          lokaal in uw browser gegenereerd; er worden geen gegevens verzonden.
        </p>
      </header>

      <ExportPanel assessment={assessment} />

      <div className="mt-8 rounded-lg border border-line bg-wit px-5 py-4">
        <p className="text-xs leading-relaxed text-ink-muted">
          <span className="font-semibold text-ink">Disclaimer.</span> Dit rapport
          is indicatief. Raadpleeg altijd een juridisch adviseur voor bindende
          interpretatie van de CADA.
        </p>
      </div>

      <StepNav
        backHref={`/assessment/${assessment.id}/rapport`}
        backLabel="Terug naar het rapport"
      />
    </WizardShell>
  );
}
