import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';

import { CadaApi } from '../../core/cada-api';
import { MetaStore } from '../../core/meta-store';
import { ReportResponse } from '../../core/models';
import { LevelBadge } from '../../shared/level-badge';
import { StepNav } from '../../shared/step-nav';
import { WizardShell } from '../../shared/wizard-shell';

@Component({
  selector: 'app-leveranciers-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WizardShell, StepNav, LevelBadge],
  template: `
    @if (report(); as report) {
      @if (metaStore.meta(); as meta) {
        <app-wizard-shell
          [assessmentId]="report.assessment.id"
          [orgName]="report.assessment.orgName"
          [currentStep]="2"
        >
          <header class="mb-8 max-w-3xl">
            <p class="eyebrow">Module 2 · Leverancierstoets</p>
            <h1 class="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
              Toets uw huidige leveranciers
            </h1>
            <p class="mt-3 text-[15px] leading-relaxed text-ink-muted">
              Per toepassing ziet u hieronder of het aanbevolen soevereiniteitsniveau haalbaar is
              met de huidige leverancier(s). Het maximaal haalbare niveau per leverancier is
              gebaseerd op jurisdictie, eigendomsstructuur en certificering.
            </p>
          </header>

          @if (report.rows.length === 0) {
            <p class="rounded-lg border border-line bg-wit px-5 py-6 text-sm text-ink-muted">
              U heeft nog geen toepassingen geprofileerd. Ga terug naar stap 1 om een toepassing
              toe te voegen.
            </p>
          } @else {
            <div class="space-y-6">
              @for (row of report.rows; track row.app.id) {
                @let compliance = row.compliance;
                <section class="overflow-hidden rounded-lg border border-line bg-wit">
                  <div
                    class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6"
                  >
                    <div class="flex items-center gap-3">
                      <h2 class="font-display text-lg font-semibold text-ink">
                        {{ row.app.name }}
                      </h2>
                      <span class="text-xs text-ink-muted">Aanbevolen niveau:</span>
                      <app-level-badge [level]="row.app.recommendedLevel" [showName]="true" />
                    </div>
                    @switch (compliance.status) {
                      @case ('ok') {
                        <span
                          class="inline-flex items-center gap-2 rounded border border-ok/30 bg-ok-bg px-3 py-1 text-sm font-semibold text-ok"
                        >
                          <span aria-hidden="true">✓</span> Niveau haalbaar
                        </span>
                      }
                      @case ('gap') {
                        <span
                          class="inline-flex items-center gap-2 rounded border border-alert/30 bg-alert-bg px-3 py-1 text-sm font-semibold text-alert"
                        >
                          <span aria-hidden="true">✕</span> Gap: niveau niet haalbaar
                        </span>
                      }
                      @default {
                        <span
                          class="inline-flex items-center gap-2 rounded border border-warn/40 bg-warn-bg px-3 py-1 text-sm font-semibold text-warn"
                        >
                          <span aria-hidden="true">?</span> Handmatige toets nodig
                        </span>
                      }
                    }
                  </div>

                  <ul class="divide-y divide-line">
                    @for (supplier of compliance.suppliers; track supplier.name) {
                      <li
                        class="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 px-5 py-3 sm:px-6"
                      >
                        <div class="min-w-48 flex-1">
                          <p class="text-sm font-semibold text-ink">
                            {{
                              supplier.name === meta.otherSupplier && row.app.supplierOther
                                ? row.app.supplierOther + ' (eigen opgave)'
                                : supplier.name
                            }}
                          </p>
                          <p class="mt-0.5 max-w-2xl text-[13px] leading-snug text-ink-muted">
                            {{
                              supplier.known
                                ? supplier.notes
                                : 'Deze leverancier staat niet in de referentiedataset. Toets jurisdictie, eigendom en certificering handmatig.'
                            }}
                          </p>
                        </div>
                        <div class="flex items-center gap-3">
                          @if (supplier.known && supplier.maxLevel !== null) {
                            <span class="text-xs text-ink-muted">max.</span>
                            <app-level-badge [level]="supplier.maxLevel" size="sm" />
                          } @else {
                            <span class="font-mono text-xs text-ink-faint">onbekend</span>
                          }
                          @if (supplier.compliant === true) {
                            <span
                              class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-ok-bg text-[13px] font-bold text-ok"
                              title="Voldoet aan het aanbevolen niveau"
                              aria-label="Voldoet"
                            >
                              ✓
                            </span>
                          } @else if (supplier.compliant === false) {
                            <span
                              class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-alert-bg text-[13px] font-bold text-alert"
                              title="Voldoet niet aan het aanbevolen niveau"
                              aria-label="Voldoet niet"
                            >
                              ✕
                            </span>
                          } @else {
                            <span
                              class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-warn-bg text-[13px] font-bold text-warn"
                              title="Compliance onbekend — handmatig toetsen"
                              aria-label="Onbekend"
                            >
                              ?
                            </span>
                          }
                        </div>
                      </li>
                    }
                  </ul>

                  @if (compliance.status === 'gap') {
                    <p
                      class="border-t border-line bg-alert-bg/60 px-5 py-3 text-[13px] leading-snug text-ink sm:px-6"
                    >
                      Met de huidige leverancierskeuze is maximaal niveau
                      {{ compliance.achievableLevel }} haalbaar, terwijl niveau
                      {{ row.app.recommendedLevel }} wordt aanbevolen. In stap 3 vindt u concrete
                      aanbevelingen om deze kloof te dichten.
                    </p>
                  }
                </section>
              }
            </div>
          }

          <app-step-nav
            [backLink]="'/assessment/' + report.assessment.id + '/toepassingen'"
            [nextLink]="'/assessment/' + report.assessment.id + '/rapport'"
            nextLabel="Naar het gap-rapport"
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
export class LeveranciersPage {
  readonly id = input.required<string>();

  private readonly api = inject(CadaApi);
  protected readonly metaStore = inject(MetaStore);

  protected readonly report = signal<ReportResponse | null>(null);
  protected readonly notFound = signal(false);

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
