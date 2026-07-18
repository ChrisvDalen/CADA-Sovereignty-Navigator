import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';

import { CadaApi } from '../../core/cada-api';
import { MetaStore } from '../../core/meta-store';
import { ReportResponse, ReportRow } from '../../core/models';
import { groupByPhase, prioritized } from '../../core/report-utils';
import { LevelBadge } from '../../shared/level-badge';
import { StatusChip } from '../../shared/status-chip';
import { StepNav } from '../../shared/step-nav';
import { WizardShell } from '../../shared/wizard-shell';

@Component({
  selector: 'app-rapport-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WizardShell, StepNav, LevelBadge, StatusChip],
  template: `
    @if (report(); as report) {
      @if (metaStore.meta()) {
        <app-wizard-shell
          [assessmentId]="report.assessment.id"
          [orgName]="report.assessment.orgName"
          [currentStep]="3"
        >
          <header class="mb-8 max-w-3xl">
            <p class="eyebrow">Module 3 · Gap-rapport &amp; roadmap</p>
            <h1 class="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
              Gap-rapport voor {{ report.assessment.orgName }}
            </h1>
            <p class="mt-3 text-[15px] leading-relaxed text-ink-muted">
              {{ summaryIntro() }}
              De prioriteitenmatrix sorteert op risico: de hoogste impact en de grootste kloof
              staan bovenaan.
            </p>
          </header>

          @if (report.rows.length === 0) {
            <p class="rounded-lg border border-line bg-wit px-5 py-6 text-sm text-ink-muted">
              U heeft nog geen toepassingen geprofileerd. Ga terug naar stap 1 om een toepassing
              toe te voegen.
            </p>
          } @else {
            <div class="space-y-10">
              <!-- 1. Samenvattingstabel -->
              <section>
                <h2 class="eyebrow mb-3">1 · Samenvatting</h2>
                <div class="overflow-x-auto rounded-lg border border-line bg-wit">
                  <table class="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr class="border-b border-line text-left">
                        <th class="eyebrow px-4 py-3 font-medium">Toepassing</th>
                        <th class="eyebrow px-4 py-3 font-medium">Aanbevolen niveau</th>
                        <th class="eyebrow px-4 py-3 font-medium">Leverancier(s)</th>
                        <th class="eyebrow px-4 py-3 font-medium">Haalbaar niveau</th>
                        <th class="eyebrow px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-line">
                      @for (row of report.rows; track row.app.id) {
                        <tr class="align-top">
                          <td class="px-4 py-3 font-semibold text-ink">{{ row.app.name }}</td>
                          <td class="px-4 py-3">
                            <app-level-badge [level]="row.app.recommendedLevel" />
                          </td>
                          <td class="max-w-60 px-4 py-3 text-ink-muted">
                            {{ row.supplierNames.join(', ') }}
                          </td>
                          <td class="px-4 py-3">
                            @if (row.compliance.achievableLevel; as achievable) {
                              <app-level-badge [level]="achievable" />
                            } @else {
                              <span class="font-mono text-xs text-ink-faint">onbekend</span>
                            }
                          </td>
                          <td class="px-4 py-3">
                            <app-status-chip [status]="row.statusLabel" />
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </section>

              <!-- 2. Prioriteitenmatrix -->
              <section>
                <h2 class="eyebrow mb-3">2 · Prioriteitenmatrix</h2>
                <ol class="space-y-2">
                  @for (row of prioritized(); track row.app.id; let index = $index) {
                    <li
                      class="flex flex-wrap items-center gap-x-5 gap-y-2 rounded border border-line bg-wit px-4 py-3"
                    >
                      <span class="font-mono text-sm font-semibold text-kobalt">
                        {{ index + 1 < 10 ? '0' + (index + 1) : index + 1 }}
                      </span>
                      <span class="min-w-40 flex-1 text-sm font-semibold text-ink">
                        {{ row.app.name }}
                      </span>
                      <span class="text-xs text-ink-muted">
                        Impact: <span class="font-medium text-ink">{{ row.impactLabel }}</span>
                      </span>
                      <span class="text-xs text-ink-muted">
                        Gap:
                        <span class="font-medium text-ink">
                          {{
                            row.compliance.gap > 0
                              ? row.compliance.gap + ' niveau' + (row.compliance.gap > 1 ? 's' : '')
                              : 'geen'
                          }}
                        </span>
                      </span>
                      <span
                        class="rounded border border-line bg-porselein px-2 py-0.5 font-mono text-[11px] text-ink-muted"
                      >
                        {{ row.phase }}
                      </span>
                      <app-status-chip [status]="row.statusLabel" />
                    </li>
                  }
                </ol>
              </section>

              <!-- 3. Roadmap per fase -->
              <section>
                <h2 class="eyebrow mb-3">3 · Roadmap per fase</h2>
                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  @for (group of phaseGroups(); track group.phase) {
                    <div class="rounded-lg border border-line bg-wit p-4">
                      <p class="font-mono text-[11px] uppercase tracking-[0.14em] text-kobalt">
                        {{ group.phase }}
                      </p>
                      <ul class="mt-2 space-y-1.5">
                        @for (row of group.rows; track row.app.id) {
                          <li class="flex items-center justify-between gap-3 text-sm">
                            <span class="font-medium text-ink">{{ row.app.name }}</span>
                            <app-level-badge [level]="row.app.recommendedLevel" size="sm" />
                          </li>
                        }
                      </ul>
                    </div>
                  }
                </div>
              </section>

              <!-- 4. Aanbevelingen -->
              <section>
                <h2 class="eyebrow mb-3">4 · Aanbevelingen per toepassing</h2>
                <div class="space-y-4">
                  @for (row of prioritized(); track row.app.id) {
                    <article class="overflow-hidden rounded-lg border border-line bg-wit">
                      <div
                        class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3"
                      >
                        <h3 class="font-display text-base font-semibold text-ink">
                          {{ row.app.name }}
                        </h3>
                        <div class="flex items-center gap-2">
                          <app-level-badge
                            [level]="row.app.recommendedLevel"
                            [showName]="true"
                            size="sm"
                          />
                          <app-status-chip [status]="row.statusLabel" />
                        </div>
                      </div>
                      @if (row.app.levelReason) {
                        <p class="border-b border-line bg-porselein/60 px-5 py-2 text-[13px] text-ink-muted">
                          <span class="font-semibold text-ink">Motivering niveau:</span>
                          {{ row.app.levelReason }}
                        </p>
                      }
                      <ul class="space-y-2 px-5 py-4">
                        @for (advies of row.recommendations; track $index) {
                          <li class="flex gap-3 text-sm leading-relaxed">
                            <span aria-hidden="true" class="mt-0.5 font-mono text-xs text-kobalt">
                              →
                            </span>
                            <span class="text-ink">{{ advies }}</span>
                          </li>
                        }
                      </ul>
                    </article>
                  }
                </div>
              </section>

              <!-- 5. Sopra Steria call-to-action -->
              <section class="on-dark rounded-lg bg-nacht px-6 py-8 text-white sm:px-8">
                <p class="font-mono text-[11px] uppercase tracking-[0.18em] text-kobalt-200">
                  Vervolgstap
                </p>
                <h2 class="mt-2 max-w-2xl font-display text-2xl font-semibold leading-snug">
                  Wilt u hulp bij de implementatie van deze aanbevelingen?
                </h2>
                <p class="mt-3 max-w-2xl text-sm leading-relaxed text-kobalt-100">
                  Sopra Steria begeleidt overheidsinstanties bij CADA-compliance: van
                  risicoanalyse en leveranciersselectie tot migratie en certificering.
                </p>
                <a
                  href="https://www.soprasteria.nl/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-5 inline-flex items-center gap-2 rounded border border-white bg-white px-5 py-2.5 text-sm font-semibold text-kobalt transition-colors hover:bg-kobalt-50"
                >
                  Neem contact op <span aria-hidden="true">→</span>
                </a>
              </section>
            </div>
          }

          <app-step-nav
            [backLink]="'/assessment/' + report.assessment.id + '/leveranciers'"
            [nextLink]="'/assessment/' + report.assessment.id + '/export'"
            nextLabel="Naar exporteren"
            [nextDisabled]="report.rows.length === 0"
            nextDisabledReason="Voeg eerst minimaal één toepassing toe."
          />
        </app-wizard-shell>
      }
    } @else if (notFound()) {
      <p class="mx-auto max-w-xl px-6 py-16 text-sm text-ink-muted">
        Sessie niet gevonden. <a href="/" class="text-kobalt underline">Terug naar start.</a>
      </p>
    }
  `,
})
export class RapportPage {
  readonly id = input.required<string>();

  private readonly api = inject(CadaApi);
  protected readonly metaStore = inject(MetaStore);

  protected readonly report = signal<ReportResponse | null>(null);
  protected readonly notFound = signal(false);

  protected readonly prioritized = computed<ReportRow[]>(() =>
    prioritized(this.report()?.rows ?? []),
  );

  /** Roadmapgroepen in uitvoeringsvolgorde; lege fasen worden verborgen. */
  protected readonly phaseGroups = computed(() => groupByPhase(this.report()?.rows ?? []));

  protected readonly summaryIntro = computed(() => {
    const rows = this.report()?.rows ?? [];
    const gaps = rows.filter((r) => r.statusLabel === 'GAP').length;
    const analysed =
      rows.length === 1
        ? 'Eén toepassing is geanalyseerd'
        : `${rows.length} toepassingen zijn geanalyseerd`;
    const gapText =
      gaps === 0
        ? '; er zijn geen compliance-gaps gevonden.'
        : gaps === 1
          ? '; bij één toepassing is een compliance-gap gevonden.'
          : `; bij ${gaps} toepassingen is een compliance-gap gevonden.`;
    return analysed + gapText;
  });

  constructor() {
    this.metaStore.load();
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });
  }

  private async load(id: string): Promise<void> {
    try {
      this.report.set(await this.api.getReport(id));
    } catch {
      this.notFound.set(true);
    }
  }
}
