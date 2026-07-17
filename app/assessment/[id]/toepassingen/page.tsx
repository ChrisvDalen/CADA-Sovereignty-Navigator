import { notFound } from "next/navigation";
import { getAssessment } from "@/lib/get-assessment";
import { WizardShell } from "@/components/WizardShell";
import { StepNav } from "@/components/StepNav";
import { ApplicationsModule } from "@/components/ApplicationsModule";

export const dynamic = "force-dynamic";

export default async function ToepassingenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assessment = await getAssessment(id);
  if (!assessment) notFound();

  const hasApps = assessment.applications.length > 0;

  return (
    <WizardShell
      assessmentId={assessment.id}
      orgName={assessment.orgName}
      currentStep={1}
    >
      <header className="mb-8 max-w-3xl">
        <p className="eyebrow">Module 1 · Toepassingsprofiler</p>
        <h1 className="mt-2 font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight text-ink">
          Profileer uw cloudtoepassingen
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
          Beantwoord per toepassing zes vragen over de data, de toepasselijke
          regelgeving en de impact bij incidenten. Op basis daarvan berekent de
          navigator het aanbevolen CADA-soevereiniteitsniveau. Voeg alle
          cloudtoepassingen van {assessment.orgName} toe voordat u verdergaat.
        </p>
      </header>

      <ApplicationsModule
        assessmentId={assessment.id}
        initialApplications={assessment.applications}
      />

      <StepNav
        backHref="/"
        backLabel="Terug naar start"
        nextHref={`/assessment/${assessment.id}/leveranciers`}
        nextLabel="Naar de leverancierstoets"
        nextDisabled={!hasApps}
        nextDisabledReason="Voeg eerst minimaal één toepassing toe."
      />
    </WizardShell>
  );
}
