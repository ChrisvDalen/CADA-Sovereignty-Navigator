import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';

import { CadaApi } from '../../core/cada-api';
import { ReportRow, SharedReport } from '../../core/models';
import { groupByPhase, prioritized } from '../../core/report-utils';
import { LevelBadge } from '../../shared/level-badge';
import { StatusChip } from '../../shared/status-chip';

/** Alleen-lezen rapportweergave achter een deellink; geen aanmelding nodig. */
@Component({
  selector: 'app-gedeeld-rapport-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, LevelBadge, StatusChip],
  template: `
    <div class="flex min-h-screen flex-col">
      <header class="on-dark bg-nacht text-white">
        <div class="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <span class="font-display text-lg font-bold tracking-tight">
            CADA Sovereignty Navigator
          </span>
          <span class="font-mono text-xs text-kobalt-200">Gedeeld rapport · alleen-lezen</span>
        </div>
      </header>

      <main class="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        @if (shared(); as shared) {
          <header class="mb-8 max-w-3xl">
            <p class="eyebrow">Gap-rapport &amp; roadmap</p>
            <h1 class="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
              {{ shared.orgName }}
            </h1>
            <p class="mt-3 text-[15px] leading-relaxed text-ink-muted">
              Alleen-lezen weergave, gedeeld op {{ shared.sharedAt | date: 'longDate' }}. Dit
              rapport toont per cloudtoepassing het aanbevolen CADA-soevereiniteitsniveau, het
              haalbare niveau bij de huidige leveranciers en de roadmap om de kloof te dichten.
            </p>
          </header>

          @if (shared.report.rows.length === 0) {
            <p class="rounded-lg border border-line bg-wit px-5 py-6 text-sm text-ink-muted">
              Dit dossier bevat nog geen geprofileerde toepassingen.
            </p>
          } @else {
            <div class="space-y-10">
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
                      @for (row of shared.report.rows; track row.app.id) {
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

              <section>
                <h2 class="eyebrow mb-3">2 · Roadmap per fase</h2>
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

              <section>
                <h2 class="eyebrow mb-3">3 · Aanbevelingen per toepassing</h2>
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
                        <p
                          class="border-b border-line bg-porselein/60 px-5 py-2 text-[13px] text-ink-muted"
                        >
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
            </div>
          }
        } @else if (notFound()) {
          <div class="mx-auto max-w-xl py-16 text-center">
            <p class="eyebrow">Deellink ongeldig</p>
            <p class="mt-3 text-sm leading-relaxed text-ink-muted">
              Deze deellink bestaat niet of is ingetrokken. Vraag de eigenaar van het dossier om
              een nieuwe link.
            </p>
          </div>
        }
      </main>

      <footer class="border-t border-line">
        <div
          class="mx-auto flex w-full max-w-5xl flex-wrap items-baseline justify-between gap-2 px-6 py-4 text-xs text-ink-muted"
        >
          <span>CADA Sovereignty Navigator — indicatief instrument, geen juridisch advies.</span>
          <span class="font-mono">Cloud and AI Development Act · van kracht per augustus 2026</span>
        </div>
      </footer>
    </div>
  `,
})
export class GedeeldRapportPage {
  readonly token = input.required<string>();

  private readonly api = inject(CadaApi);

  protected readonly shared = signal<SharedReport | null>(null);
  protected readonly notFound = signal(false);

  protected readonly prioritized = computed<ReportRow[]>(() =>
    prioritized(this.shared()?.report.rows ?? []),
  );

  protected readonly phaseGroups = computed(() => groupByPhase(this.shared()?.report.rows ?? []));

  constructor() {
    effect(() => {
      const token = this.token();
      untracked(() => this.load(token));
    });
  }

  private async load(token: string): Promise<void> {
    this.notFound.set(false);
    try {
      this.shared.set(await this.api.getSharedReport(token));
    } catch {
      this.shared.set(null);
      this.notFound.set(true);
    }
  }
}
