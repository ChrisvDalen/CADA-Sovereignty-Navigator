import { notFound } from "next/navigation";
import { getAssessment } from "@/lib/get-assessment";
import { buildReportRows, prioritized } from "@/lib/report";
import { WizardShell } from "@/components/WizardShell";
import { StepNav } from "@/components/StepNav";
import { LevelBadge } from "@/components/LevelBadge";

export const dynamic = "force-dynamic";

function StatusChip({ status }: { status: "OK" | "GAP" | "ONBEKEND" }) {
  if (status === "OK") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-ok/30 bg-ok-bg px-2 py-0.5 font-mono text-[11px] font-semibold text-ok">
        ✓ OK
      </span>
    );
  }
  if (status === "GAP") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-alert/30 bg-alert-bg px-2 py-0.5 font-mono text-[11px] font-semibold text-alert">
        ✕ GAP
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-warn/40 bg-warn-bg px-2 py-0.5 font-mono text-[11px] font-semibold text-warn">
      ? ONBEKEND
    </span>
  );
}

export default async function RapportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assessment = await getAssessment(id);
  if (!assessment) notFound();

  const rows = buildReportRows(assessment);
  const priorityRows = prioritized(rows);
  const gaps = rows.filter((r) => r.statusLabel === "GAP").length;

  return (
    <WizardShell
      assessmentId={assessment.id}
      orgName={assessment.orgName}
      currentStep={3}
    >
      <header className="mb-8 max-w-3xl">
        <p className="eyebrow">Module 3 · Gap-rapport &amp; roadmap</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
          Gap-rapport voor {assessment.orgName}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
          {rows.length === 1
            ? "Eén toepassing is geanalyseerd"
            : `${rows.length} toepassingen zijn geanalyseerd`}
          {gaps === 0
            ? "; er zijn geen compliance-gaps gevonden."
            : gaps === 1
              ? "; bij één toepassing is een compliance-gap gevonden."
              : `; bij ${gaps} toepassingen is een compliance-gap gevonden.`}{" "}
          De prioriteitenmatrix sorteert op risico: de hoogste impact en de
          grootste kloof staan bovenaan.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-line bg-wit px-5 py-6 text-sm text-ink-muted">
          U heeft nog geen toepassingen geprofileerd. Ga terug naar stap 1 om een
          toepassing toe te voegen.
        </p>
      ) : (
        <div className="space-y-10">
          {/* 1. Samenvattingstabel */}
          <section>
            <h2 className="eyebrow mb-3">1 · Samenvatting</h2>
            <div className="overflow-x-auto rounded-lg border border-line bg-wit">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="eyebrow px-4 py-3 font-medium">Toepassing</th>
                    <th className="eyebrow px-4 py-3 font-medium">
                      Aanbevolen niveau
                    </th>
                    <th className="eyebrow px-4 py-3 font-medium">
                      Leverancier(s)
                    </th>
                    <th className="eyebrow px-4 py-3 font-medium">
                      Haalbaar niveau
                    </th>
                    <th className="eyebrow px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((row) => (
                    <tr key={row.app.id} className="align-top">
                      <td className="px-4 py-3 font-semibold text-ink">
                        {row.app.name}
                      </td>
                      <td className="px-4 py-3">
                        <LevelBadge level={row.app.recommendedLevel} />
                      </td>
                      <td className="max-w-60 px-4 py-3 text-ink-muted">
                        {row.supplierNames.join(", ")}
                      </td>
                      <td className="px-4 py-3">
                        {row.compliance.achievableLevel !== null ? (
                          <LevelBadge level={row.compliance.achievableLevel} />
                        ) : (
                          <span className="font-mono text-xs text-ink-faint">
                            onbekend
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip status={row.statusLabel} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 2. Prioriteitenmatrix */}
          <section>
            <h2 className="eyebrow mb-3">2 · Prioriteitenmatrix</h2>
            <ol className="space-y-2">
              {priorityRows.map((row, index) => (
                <li
                  key={row.app.id}
                  className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded border border-line bg-wit px-4 py-3"
                >
                  <span className="font-mono text-sm font-semibold text-kobalt">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-40 flex-1 text-sm font-semibold text-ink">
                    {row.app.name}
                  </span>
                  <span className="text-xs text-ink-muted">
                    Impact: <span className="font-medium text-ink">{row.impactLabel}</span>
                  </span>
                  <span className="text-xs text-ink-muted">
                    Gap:{" "}
                    <span className="font-medium text-ink">
                      {row.compliance.gap > 0
                        ? `${row.compliance.gap} niveau${row.compliance.gap > 1 ? "s" : ""}`
                        : "geen"}
                    </span>
                  </span>
                  <StatusChip status={row.statusLabel} />
                </li>
              ))}
            </ol>
          </section>

          {/* 3. Aanbevelingen */}
          <section>
            <h2 className="eyebrow mb-3">3 · Aanbevelingen per toepassing</h2>
            <div className="space-y-4">
              {priorityRows.map((row) => (
                <article key={row.app.id} className="overflow-hidden rounded-lg border border-line bg-wit">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
                    <h3 className="font-display text-base font-semibold text-ink">
                      {row.app.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <LevelBadge level={row.app.recommendedLevel} showName size="sm" />
                      <StatusChip status={row.statusLabel} />
                    </div>
                  </div>
                  <ul className="space-y-2 px-5 py-4">
                    {row.recommendations.map((advies, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed">
                        <span
                          aria-hidden
                          className="mt-0.5 font-mono text-xs text-kobalt"
                        >
                          →
                        </span>
                        <span className="text-ink">{advies}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          {/* 4. Sopra Steria call-to-action */}
          <section className="on-dark rounded-lg bg-nacht px-6 py-8 text-white sm:px-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-kobalt-200">
              Vervolgstap
            </p>
            <h2 className="mt-2 max-w-2xl font-display text-2xl font-semibold leading-snug">
              Wilt u hulp bij de implementatie van deze aanbevelingen?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-kobalt-100">
              Sopra Steria begeleidt overheidsinstanties bij CADA-compliance: van
              risicoanalyse en leveranciersselectie tot migratie en certificering.
            </p>
            <a
              href="https://www.soprasteria.nl/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded border border-white bg-white px-5 py-2.5 text-sm font-semibold text-kobalt transition-colors hover:bg-kobalt-50"
            >
              Neem contact op <span aria-hidden>→</span>
            </a>
          </section>
        </div>
      )}

      <StepNav
        backHref={`/assessment/${assessment.id}/leveranciers`}
        nextHref={`/assessment/${assessment.id}/export`}
        nextLabel="Naar exporteren"
        nextDisabled={rows.length === 0}
        nextDisabledReason="Voeg eerst minimaal één toepassing toe."
      />
    </WizardShell>
  );
}
