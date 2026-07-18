import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CadaApi } from '../../core/cada-api';
import { AssessmentSummary } from '../../core/models';
import { AccountChip } from '../../shared/account-chip';

/** Portfolio-dashboard: alle dossiers met hun compliance-statistiek. */
@Component({
  selector: 'app-dossiers-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, AccountChip],
  template: `
    <div class="flex min-h-screen flex-col">
      <header class="on-dark bg-nacht text-white">
        <div class="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <a routerLink="/" class="font-display text-lg font-bold tracking-tight">
            CADA Sovereignty Navigator
          </a>
          <span class="flex items-center gap-4">
            <span class="font-mono text-xs text-kobalt-200">Dossieroverzicht</span>
            <app-account-chip />
          </span>
        </div>
      </header>

      <main class="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <header class="mb-8 max-w-3xl">
          <p class="eyebrow">Portfolio</p>
          <h1 class="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
            Alle dossiers
          </h1>
          <p class="mt-3 text-[15px] leading-relaxed text-ink-muted">
            Overzicht van alle gestarte analyses met het aantal geprofileerde toepassingen en de
            gevonden compliance-gaps.
          </p>
        </header>

        @if (summaries(); as summaries) {
          <!-- Portfoliostatistiek -->
          <div class="mb-8 grid gap-4 sm:grid-cols-3">
            <div class="rounded-lg border border-line bg-wit p-5">
              <p class="eyebrow">Dossiers</p>
              <p class="mt-1 font-display text-3xl font-semibold text-ink">{{ summaries.length }}</p>
            </div>
            <div class="rounded-lg border border-line bg-wit p-5">
              <p class="eyebrow">Toepassingen</p>
              <p class="mt-1 font-display text-3xl font-semibold text-ink">
                {{ totalApplications() }}
              </p>
            </div>
            <div class="rounded-lg border border-line bg-wit p-5">
              <p class="eyebrow">Compliance-gaps</p>
              <p
                class="mt-1 font-display text-3xl font-semibold"
                [class]="totalGaps() > 0 ? 'text-alert' : 'text-ok'"
              >
                {{ totalGaps() }}
              </p>
            </div>
          </div>

          @if (summaries.length === 0) {
            <p class="rounded-lg border border-line bg-wit px-5 py-6 text-sm text-ink-muted">
              Er zijn nog geen dossiers.
              <a routerLink="/" class="font-semibold text-kobalt underline underline-offset-4">
                Start een eerste analyse.
              </a>
            </p>
          } @else {
            <div class="overflow-hidden rounded-lg border border-line bg-wit">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-line text-left">
                    <th class="eyebrow px-4 py-3 font-medium">Organisatie</th>
                    <th class="eyebrow hidden px-4 py-3 font-medium sm:table-cell">Gestart</th>
                    <th class="eyebrow px-4 py-3 font-medium">Toepassingen</th>
                    <th class="eyebrow px-4 py-3 font-medium">Gaps</th>
                    <th class="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-line">
                  @for (summary of summaries; track summary.id) {
                    <tr>
                      <td class="px-4 py-3 font-semibold text-ink">{{ summary.orgName }}</td>
                      <td class="hidden px-4 py-3 text-ink-muted sm:table-cell">
                        {{ summary.createdAt | date: 'd MMMM y' }}
                      </td>
                      <td class="px-4 py-3 text-ink-muted">{{ summary.applicationCount }}</td>
                      <td class="px-4 py-3">
                        @if (summary.gapCount > 0) {
                          <span
                            class="rounded border border-alert/30 bg-alert-bg px-2 py-0.5 font-mono text-[11px] font-semibold text-alert"
                          >
                            {{ summary.gapCount }} GAP{{ summary.gapCount > 1 ? 'S' : '' }}
                          </span>
                        } @else if (summary.applicationCount > 0) {
                          <span
                            class="rounded border border-ok/30 bg-ok-bg px-2 py-0.5 font-mono text-[11px] font-semibold text-ok"
                          >
                            OK
                          </span>
                        } @else {
                          <span class="font-mono text-xs text-ink-faint">—</span>
                        }
                      </td>
                      <td class="px-4 py-3 text-right">
                        <a
                          [routerLink]="['/assessment', summary.id, 'toepassingen']"
                          class="text-sm font-medium text-kobalt underline-offset-4 hover:underline"
                        >
                          Openen →
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        } @else {
          <p class="text-sm text-ink-muted">Dossiers worden geladen…</p>
        }

        <div class="mt-8">
          <a
            routerLink="/"
            class="inline-flex items-center gap-2 rounded border border-line-strong bg-wit px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-kobalt hover:text-kobalt"
          >
            <span aria-hidden="true">←</span>
            Terug naar start
          </a>
        </div>
      </main>
    </div>
  `,
})
export class DossiersPage {
  private readonly api = inject(CadaApi);

  protected readonly summaries = signal<AssessmentSummary[] | null>(null);

  protected readonly totalApplications = computed(() =>
    (this.summaries() ?? []).reduce((sum, s) => sum + s.applicationCount, 0),
  );
  protected readonly totalGaps = computed(() =>
    (this.summaries() ?? []).reduce((sum, s) => sum + s.gapCount, 0),
  );

  constructor() {
    this.api.listAssessments().then(
      (summaries) => this.summaries.set(summaries),
      () => this.summaries.set([]),
    );
  }
}
