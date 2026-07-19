import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthStore } from '../../core/auth-store';
import { CadaApi } from '../../core/cada-api';
import { LocaleStore } from '../../core/i18n';
import { MetaStore } from '../../core/meta-store';
import { CadaLevel } from '../../core/models';
import { DeadlineBanner } from '../../shared/deadline-banner';
import { Ladder } from '../../shared/ladder';
import { LanguageToggle } from '../../shared/language-toggle';

const STORAGE_KEY = 'cada-assessment-id';

interface ResumeInfo {
  id: string;
  orgName: string;
  applicationCount: number;
}

@Component({
  selector: 'app-start-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Ladder, RouterLink, LanguageToggle, DeadlineBanner],
  template: `
    <div class="flex min-h-screen flex-1 flex-col lg:flex-row">
      <!-- Linkerpaneel: het instrument en de ladder -->
      <section class="on-dark bg-nacht text-white lg:w-[55%]">
        <div
          class="mx-auto flex h-full max-w-2xl flex-col justify-between gap-12 px-6 py-10 lg:px-12 lg:py-14"
        >
          <div>
            <p class="rise-in font-mono text-[11px] uppercase tracking-[0.18em] text-kobalt-200">
              {{ t('start.eyebrow') }}
            </p>
            <div class="mt-8 flex items-end gap-6">
              <app-ladder [level]="4" size="lg" [animate]="true" />
              <h1
                class="rise-in font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl"
              >
                CADA Sovereignty<br />Navigator
              </h1>
            </div>
            <p
              class="rise-in mt-6 max-w-lg text-[15px] leading-relaxed text-kobalt-100"
              style="animation-delay: 0.15s"
            >
              De CADA verplicht overheidsinstanties om per cloudtoepassing te bepalen welk
              soevereiniteitsniveau van toepassing is. Deze navigator begeleidt u door dat proces
              in vier stappen: profileer uw toepassingen, toets uw leveranciers, ontvang een
              gap-rapport met roadmap en exporteer het resultaat.
            </p>
          </div>

          <div class="rise-in" style="animation-delay: 0.3s">
            <h2 class="font-mono text-[11px] uppercase tracking-[0.18em] text-kobalt-200">
              De soevereiniteitsladder — vier niveaus
            </h2>
            <dl class="mt-4 divide-y divide-white/12 border-y border-white/12">
              @for (level of levels; track level) {
                <div class="flex items-start gap-4 py-3">
                  <dt class="flex w-36 shrink-0 items-center gap-2.5 sm:w-44">
                    <app-ladder [level]="level" />
                    <span>
                      <span class="font-mono text-sm font-medium">N{{ level }}</span>
                      <span class="block font-display text-sm font-semibold leading-snug">
                        {{ metaStore.levelInfo(level).name }}
                      </span>
                    </span>
                  </dt>
                  <dd class="text-sm leading-snug text-kobalt-100">
                    {{ metaStore.levelInfo(level).description }}
                  </dd>
                </div>
              }
            </dl>
          </div>
        </div>
      </section>

      <!-- Rechterpaneel: dossier openen -->
      <section class="flex flex-1 items-center bg-porselein">
        <div class="mx-auto w-full max-w-md px-6 py-12 lg:px-10">
          <div class="mb-4 flex items-center justify-between gap-3">
            <app-deadline-banner />
            <app-language-toggle variant="light" />
          </div>
          <div
            class="rounded-lg border border-line bg-wit p-6 shadow-[0_1px_2px_rgba(11,21,65,0.06)] sm:p-8"
          >
            <p class="eyebrow">{{ t('start.stepLabel') }}</p>
            <h2 class="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
              {{ t('start.openDossier') }}
            </h2>
            <p class="mt-2 mb-6 text-sm text-ink-muted">
              {{ t('start.orgIntro') }}
            </p>

            <div class="space-y-6">
              <form class="space-y-4" (submit)="start($event)">
                <div>
                  <label for="orgName" class="mb-1.5 block text-sm font-semibold text-ink">
                    {{ t('start.orgLabel') }}
                  </label>
                  <input
                    id="orgName"
                    type="text"
                    [ngModel]="orgName()"
                    (ngModelChange)="orgName.set($event)"
                    name="orgName"
                    [placeholder]="t('start.orgPlaceholder')"
                    autocomplete="organization"
                    class="w-full rounded border border-line-strong bg-wit px-3 py-2.5 text-sm transition-colors placeholder:text-ink-faint focus:border-kobalt"
                  />
                </div>
                @if (error(); as message) {
                  <p class="rounded border border-alert/30 bg-alert-bg px-3 py-2 text-sm text-alert">
                    {{ message }}
                  </p>
                }
                <button
                  type="submit"
                  [disabled]="!orgName().trim() || busy()"
                  class="w-full rounded border border-kobalt bg-kobalt px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-kobalt-diep hover:bg-kobalt-diep disabled:cursor-not-allowed disabled:border-line disabled:bg-porselein disabled:text-ink-faint"
                >
                  {{ busy() ? t('start.submitBusy') : t('start.submit') }}
                </button>
              </form>

              @if (resume(); as info) {
                <div class="rounded border border-line bg-porselein px-4 py-3">
                  <p class="eyebrow mb-1">{{ t('start.resumeFound') }}</p>
                  <p class="text-sm text-ink">
                    <span class="font-semibold">{{ info.orgName }}</span>
                    —
                    {{
                      info.applicationCount === 1
                        ? '1 toepassing'
                        : info.applicationCount + ' toepassingen'
                    }}
                    geprofileerd.
                  </p>
                  <button
                    type="button"
                    (click)="resumeSession(info.id)"
                    class="mt-2 text-sm font-semibold text-kobalt underline underline-offset-4 hover:text-kobalt-diep"
                  >
                    {{ t('start.resume') }}
                  </button>
                </div>
              }
            </div>
          </div>
          <p class="mt-4 px-1 text-xs leading-relaxed text-ink-muted">
            {{ t('start.disclaimer') }}
          </p>
          <p class="mt-3 flex gap-4 px-1 text-xs">
            <a
              routerLink="/dossiers"
              class="font-semibold text-kobalt underline-offset-4 hover:underline"
            >
              {{ t('start.allDossiers') }}
            </a>
            <a
              routerLink="/beheer/leveranciers"
              class="font-semibold text-kobalt underline-offset-4 hover:underline"
            >
              {{ t('start.referenceData') }}
            </a>
          </p>
          @if (authStore.user(); as user) {
            <p class="mt-3 px-1 text-xs text-ink-muted">
              {{ t('start.signedInAs') }} <span class="font-semibold text-ink">{{ user.email }}</span>
              ·
              <button
                type="button"
                (click)="logout()"
                class="font-semibold text-kobalt underline-offset-4 hover:underline"
              >
                {{ t('common.signOut') }}
              </button>
            </p>
          }
        </div>
      </section>
    </div>
  `,
})
export class StartPage {
  private readonly api = inject(CadaApi);
  private readonly router = inject(Router);
  protected readonly metaStore = inject(MetaStore);
  protected readonly authStore = inject(AuthStore);
  private readonly locale = inject(LocaleStore);

  protected t(key: string): string {
    return this.locale.t(key);
  }

  protected readonly levels: CadaLevel[] = [1, 2, 3, 4];
  protected readonly orgName = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly resume = signal<ResumeInfo | null>(null);

  constructor() {
    this.metaStore.load();
    this.checkResume();
  }

  private async checkResume(): Promise<void> {
    const savedId = window.localStorage.getItem(STORAGE_KEY);
    if (!savedId) return;
    try {
      const assessment = await this.api.getAssessment(savedId);
      this.resume.set({
        id: assessment.id,
        orgName: assessment.orgName,
        applicationCount: assessment.applications.length,
      });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  protected async start(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.orgName().trim() || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const assessment = await this.api.createAssessment(this.orgName().trim());
      window.localStorage.setItem(STORAGE_KEY, assessment.id);
      await this.router.navigate(['/assessment', assessment.id, 'toepassingen']);
    } catch (err) {
      this.error.set(CadaApi.errorMessage(err, 'Er ging iets mis.'));
      this.busy.set(false);
    }
  }

  protected resumeSession(id: string): void {
    this.router.navigate(['/assessment', id, 'toepassingen']);
  }

  protected async logout(): Promise<void> {
    await this.authStore.logout();
    await this.router.navigateByUrl('/login');
  }
}
