import { notFound } from "next/navigation";
import { getAssessment } from "@/lib/get-assessment";
import { checkCompliance, OTHER_SUPPLIER } from "@/lib/cada";
import { WizardShell } from "@/components/WizardShell";
import { StepNav } from "@/components/StepNav";
import { LevelBadge } from "@/components/LevelBadge";

export const dynamic = "force-dynamic";

export default async function LeveranciersPage({
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
      currentStep={2}
    >
      <header className="mb-8 max-w-3xl">
        <p className="eyebrow">Module 2 · Leverancierstoets</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
          Toets uw huidige leveranciers
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
          Per toepassing ziet u hieronder of het aanbevolen soevereiniteitsniveau
          haalbaar is met de huidige leverancier(s). Het maximaal haalbare niveau
          per leverancier is gebaseerd op jurisdictie, eigendomsstructuur en
          certificering.
        </p>
      </header>

      {assessment.applications.length === 0 ? (
        <p className="rounded-lg border border-line bg-wit px-5 py-6 text-sm text-ink-muted">
          U heeft nog geen toepassingen geprofileerd. Ga terug naar stap 1 om een
          toepassing toe te voegen.
        </p>
      ) : (
        <div className="space-y-6">
          {assessment.applications.map((app) => {
            const compliance = checkCompliance(app.suppliers, app.recommendedLevel);
            return (
              <section key={app.id} className="overflow-hidden rounded-lg border border-line bg-wit">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-lg font-semibold text-ink">
                      {app.name}
                    </h2>
                    <span className="text-xs text-ink-muted">
                      Aanbevolen niveau:
                    </span>
                    <LevelBadge level={app.recommendedLevel} showName />
                  </div>
                  {compliance.status === "ok" && (
                    <span className="inline-flex items-center gap-2 rounded border border-ok/30 bg-ok-bg px-3 py-1 text-sm font-semibold text-ok">
                      <span aria-hidden>✓</span> Niveau haalbaar
                    </span>
                  )}
                  {compliance.status === "gap" && (
                    <span className="inline-flex items-center gap-2 rounded border border-alert/30 bg-alert-bg px-3 py-1 text-sm font-semibold text-alert">
                      <span aria-hidden>✕</span> Gap: niveau niet haalbaar
                    </span>
                  )}
                  {compliance.status === "unknown" && (
                    <span className="inline-flex items-center gap-2 rounded border border-warn/40 bg-warn-bg px-3 py-1 text-sm font-semibold text-warn">
                      <span aria-hidden>?</span> Handmatige toets nodig
                    </span>
                  )}
                </div>

                <ul className="divide-y divide-line">
                  {compliance.suppliers.map((supplier) => {
                    const displayName =
                      supplier.name === OTHER_SUPPLIER && app.supplierOther
                        ? `${app.supplierOther} (eigen opgave)`
                        : supplier.name;
                    return (
                      <li
                        key={supplier.name}
                        className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 px-5 py-3 sm:px-6"
                      >
                        <div className="min-w-48 flex-1">
                          <p className="text-sm font-semibold text-ink">
                            {displayName}
                          </p>
                          <p className="mt-0.5 max-w-2xl text-[13px] leading-snug text-ink-muted">
                            {supplier.known
                              ? supplier.notes
                              : "Deze leverancier staat niet in de referentiedataset. Toets jurisdictie, eigendom en certificering handmatig."}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {supplier.known && supplier.maxLevel !== null ? (
                            <>
                              <span className="text-xs text-ink-muted">
                                max.
                              </span>
                              <LevelBadge level={supplier.maxLevel} size="sm" />
                            </>
                          ) : (
                            <span className="font-mono text-xs text-ink-faint">
                              onbekend
                            </span>
                          )}
                          {supplier.compliant === true && (
                            <span
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-ok-bg text-[13px] font-bold text-ok"
                              title="Voldoet aan het aanbevolen niveau"
                              aria-label="Voldoet"
                            >
                              ✓
                            </span>
                          )}
                          {supplier.compliant === false && (
                            <span
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-alert-bg text-[13px] font-bold text-alert"
                              title="Voldoet niet aan het aanbevolen niveau"
                              aria-label="Voldoet niet"
                            >
                              ✕
                            </span>
                          )}
                          {supplier.compliant === null && (
                            <span
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-warn-bg text-[13px] font-bold text-warn"
                              title="Compliance onbekend — handmatig toetsen"
                              aria-label="Onbekend"
                            >
                              ?
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {compliance.status === "gap" && (
                  <p className="border-t border-line bg-alert-bg/60 px-5 py-3 text-[13px] leading-snug text-ink sm:px-6">
                    Met de huidige leverancierskeuze is maximaal niveau{" "}
                    {compliance.achievableLevel} haalbaar, terwijl niveau{" "}
                    {app.recommendedLevel} wordt aanbevolen. In stap 3 vindt u
                    concrete aanbevelingen om deze kloof te dichten.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}

      <StepNav
        backHref={`/assessment/${assessment.id}/toepassingen`}
        nextHref={`/assessment/${assessment.id}/rapport`}
        nextLabel="Naar het gap-rapport"
        nextDisabled={assessment.applications.length === 0}
        nextDisabledReason="Voeg eerst minimaal één toepassing toe."
      />
    </WizardShell>
  );
}
