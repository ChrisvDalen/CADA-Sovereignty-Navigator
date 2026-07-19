import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CadaApi } from '../../core/cada-api';
import { LocaleStore } from '../../core/i18n';
import { MetaStore } from '../../core/meta-store';
import { AssessmentSummary } from '../../core/models';
import { AccountChip } from '../../shared/account-chip';
import { DeadlineBanner } from '../../shared/deadline-banner';
import { LanguageToggle } from '../../shared/language-toggle';
import { LevelDistributionChart } from '../../shared/level-distribution-chart';

/** Portfolio-dashboard: alle dossiers met compliance-statistiek en beheer. */
@Component({
  selector: 'app-dossiers-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DatePipe,
    FormsModule,
    AccountChip,
    DeadlineBanner,
    LanguageToggle,
    LevelDistributionChart,
  ],
  template: `
    <div class="flex min-h-screen flex-col">
      <header class="on-dark bg-nacht text-white">
        <div class="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <a routerLink="/" class="font-display text-lg font-bold tracking-tight">
            CADA Sovereignty Navigator
          </a>
          <span class="flex items-center gap-4">
            <span class="hidden font-mono text-xs text-kobalt-200 sm:block">
              {{ t('dossiers.headerTag') }}
            </span>
            <app-language-toggle variant="dark" />
            <app-account-chip />
          </span>
        </div>
      </header>

      <main class="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <header class="mb-8 max-w-3xl">
          <div class="mb-3"><app-deadline-banner /></div>
          <p class="eyebrow">{{ t('dossiers.eyebrow') }}</p>
          <h1 class="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
            {{ t('dossiers.title') }}
          </h1>
          <p class="mt-3 text-[15px] leading-relaxed text-ink-muted">
            {{ t('dossiers.intro') }}
          </p>
        </header>

        @if (error(); as message) {
          <p class="mb-4 rounded border border-alert/30 bg-alert-bg px-3 py-2 text-sm text-alert">
            {{ message }}
          </p>
        }

        @if (summaries(); as summaries) {
          <!-- Portfoliostatistiek -->
          <div class="mb-6 grid gap-4 sm:grid-cols-3">
            <div class="rounded-lg border border-line bg-wit p-5">
              <p class="eyebrow">{{ t('dossiers.statDossiers') }}</p>
              <p class="mt-1 font-display text-3xl font-semibold text-ink">{{ summaries.length }}</p>
            </div>
            <div class="rounded-lg border border-line bg-wit p-5">
              <p class="eyebrow">{{ t('dossiers.statApplications') }}</p>
              <p class="mt-1 font-display text-3xl font-semibold text-ink">
                {{ totalApplications() }}
              </p>
            </div>
            <div class="rounded-lg border border-line bg-wit p-5">
              <p class="eyebrow">{{ t('dossiers.statGaps') }}</p>
              <p
                class="mt-1 font-display text-3xl font-semibold"
                [class]="totalGaps() > 0 ? 'text-alert' : 'text-ok'"
              >
                {{ totalGaps() }}
              </p>
            </div>
          </div>

          <!-- Niveauverdeling over de portfolio -->
          @if (totalApplications() > 0) {
            <div class="mb-8 rounded-lg border border-line bg-wit p-5">
              <p class="eyebrow mb-3">{{ t('dossiers.levelDistribution') }}</p>
              <app-level-distribution-chart [counts]="portfolioLevels()" />
            </div>
          }

          <div class="mb-3 flex items-center justify-end">
            <button
              type="button"
              (click)="toggleArchived()"
              class="text-sm font-semibold text-kobalt underline-offset-4 hover:underline"
            >
              {{ includeArchived() ? t('dossiers.hideArchived') : t('dossiers.showArchived') }}
            </button>
          </div>

          @if (summaries.length === 0) {
            <p class="rounded-lg border border-line bg-wit px-5 py-6 text-sm text-ink-muted">
              {{ t('dossiers.empty') }}
              <a routerLink="/" class="font-semibold text-kobalt underline underline-offset-4">
                {{ t('dossiers.startFirst') }}
              </a>
            </p>
          } @else {
            <div class="overflow-x-auto rounded-lg border border-line bg-wit">
              <table class="w-full min-w-[640px] text-sm">
                <thead>
                  <tr class="border-b border-line text-left">
                    <th class="eyebrow px-4 py-3 font-medium">{{ t('dossiers.colOrg') }}</th>
                    <th class="eyebrow hidden px-4 py-3 font-medium sm:table-cell">
                      {{ t('dossiers.colStarted') }}
                    </th>
                    <th class="eyebrow px-4 py-3 font-medium">
                      {{ t('dossiers.colApplications') }}
                    </th>
                    <th class="eyebrow px-4 py-3 font-medium">{{ t('dossiers.colGaps') }}</th>
                    <th class="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-line">
                  @for (summary of summaries; track summary.id) {
                    <tr [class]="summary.archived ? 'opacity-60' : ''">
                      <td class="px-4 py-3">
                        @if (editingId() === summary.id) {
                          <form class="flex items-center gap-2" (submit)="saveRename($event, summary)">
                            <input
                              [ngModel]="editName()"
                              (ngModelChange)="editName.set($event)"
                              name="rename"
                              class="rounded border border-line-strong bg-wit px-2 py-1 text-sm focus:border-kobalt"
                            />
                            <button
                              type="submit"
                              class="text-sm font-semibold text-kobalt hover:underline"
                            >
                              {{ t('dossiers.save') }}
                            </button>
                            <button
                              type="button"
                              (click)="editingId.set(null)"
                              class="text-sm text-ink-muted hover:underline"
                            >
                              {{ t('dossiers.cancel') }}
                            </button>
                          </form>
                        } @else {
                          <span class="font-semibold text-ink">{{ summary.orgName }}</span>
                          @if (summary.archived) {
                            <span
                              class="ml-2 rounded border border-line bg-porselein px-1.5 py-0.5 text-[11px] text-ink-muted"
                            >
                              {{ t('dossiers.archivedTag') }}
                            </span>
                          }
                        }
                      </td>
                      <td class="hidden px-4 py-3 text-ink-muted sm:table-cell">
                        {{ summary.createdAt | date: 'd MMM y' }}
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
                      <td class="px-4 py-3 text-right whitespace-nowrap">
                        <a
                          [routerLink]="['/assessment', summary.id, 'toepassingen']"
                          class="text-sm font-medium text-kobalt underline-offset-4 hover:underline"
                        >
                          {{ t('dossiers.open') }}
                        </a>
                        <button
                          type="button"
                          (click)="startRename(summary)"
                          class="ml-3 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
                        >
                          {{ t('dossiers.rename') }}
                        </button>
                        <button
                          type="button"
                          (click)="toggleArchive(summary)"
                          class="ml-3 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
                        >
                          {{ summary.archived ? t('dossiers.unarchive') : t('dossiers.archive') }}
                        </button>
                        <button
                          type="button"
                          (click)="remove(summary)"
                          class="ml-3 text-sm text-alert underline-offset-4 hover:underline"
                        >
                          {{ t('dossiers.delete') }}
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        } @else {
          <p class="text-sm text-ink-muted">{{ t('common.loading') }}</p>
        }

        <div class="mt-8">
          <a
            routerLink="/"
            class="inline-flex items-center gap-2 rounded border border-line-strong bg-wit px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-kobalt hover:text-kobalt"
          >
            <span aria-hidden="true">←</span>
            {{ t('common.backToStart') }}
          </a>
        </div>
      </main>
    </div>
  `,
})
export class DossiersPage {
  private readonly api = inject(CadaApi);
  private readonly locale = inject(LocaleStore);
  private readonly metaStore = inject(MetaStore);

  protected readonly summaries = signal<AssessmentSummary[] | null>(null);
  protected readonly includeArchived = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly editName = signal('');
  protected readonly error = signal<string | null>(null);

  protected readonly totalApplications = computed(() =>
    (this.summaries() ?? []).reduce((sum, s) => sum + s.applicationCount, 0),
  );
  protected readonly totalGaps = computed(() =>
    (this.summaries() ?? []).reduce((sum, s) => sum + s.gapCount, 0),
  );

  /** Niveauverdeling opgeteld over alle dossiers in de portfolio. */
  protected readonly portfolioLevels = computed<Record<string, number>>(() => {
    const totals: Record<string, number> = {};
    for (const summary of this.summaries() ?? []) {
      for (const [level, count] of Object.entries(summary.levelCounts ?? {})) {
        totals[level] = (totals[level] ?? 0) + count;
      }
    }
    return totals;
  });

  constructor() {
    this.metaStore.load();
    this.reload();
  }

  protected t(key: string): string {
    return this.locale.t(key);
  }

  private async reload(): Promise<void> {
    try {
      this.summaries.set(await this.api.listAssessments(this.includeArchived()));
    } catch {
      this.summaries.set([]);
    }
  }

  protected toggleArchived(): void {
    this.includeArchived.update((v) => !v);
    this.reload();
  }

  protected startRename(summary: AssessmentSummary): void {
    this.editName.set(summary.orgName);
    this.editingId.set(summary.id);
  }

  protected async saveRename(event: Event, summary: AssessmentSummary): Promise<void> {
    event.preventDefault();
    const name = this.editName().trim();
    if (!name) return;
    this.error.set(null);
    try {
      await this.api.renameAssessment(summary.id, name);
      this.editingId.set(null);
      await this.reload();
    } catch (err) {
      this.error.set(CadaApi.errorMessage(err, 'Hernoemen is niet gelukt.'));
    }
  }

  protected async toggleArchive(summary: AssessmentSummary): Promise<void> {
    this.error.set(null);
    try {
      await this.api.setAssessmentArchived(summary.id, !summary.archived);
      await this.reload();
    } catch (err) {
      this.error.set(CadaApi.errorMessage(err, 'Archiveren is niet gelukt.'));
    }
  }

  protected async remove(summary: AssessmentSummary): Promise<void> {
    if (!window.confirm(this.t('dossiers.confirmDelete'))) return;
    this.error.set(null);
    try {
      await this.api.deleteAssessment(summary.id);
      await this.reload();
    } catch (err) {
      this.error.set(CadaApi.errorMessage(err, 'Verwijderen is niet gelukt.'));
    }
  }
}
