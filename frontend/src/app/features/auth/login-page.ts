import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CadaApi } from '../../core/cada-api';
import { LocaleStore } from '../../core/i18n';
import { MagicLinkResult } from '../../core/models';
import { LanguageToggle } from '../../shared/language-toggle';

/** Aanmelden via magic-link: e-mailadres invullen, link ontvangen, klaar. */
@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LanguageToggle],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-porselein px-6 py-12">
      <div class="w-full max-w-md">
        <div class="mb-4 flex justify-end">
          <app-language-toggle variant="light" />
        </div>
        <div class="mb-8 text-center">
          <p class="font-mono text-[11px] uppercase tracking-[0.18em] text-kobalt">
            {{ t('start.eyebrow') }}
          </p>
          <h1 class="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
            CADA Sovereignty Navigator
          </h1>
        </div>

        <div
          class="rounded-lg border border-line bg-wit p-6 shadow-[0_1px_2px_rgba(11,21,65,0.06)] sm:p-8"
        >
          @if (sent(); as result) {
            <p class="eyebrow">{{ t('login.sentEyebrow') }}</p>
            <h2 class="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
              {{ t('login.sentTitle') }}
            </h2>
            <p class="mt-2 text-sm leading-relaxed text-ink-muted">
              {{ locale.t('login.sentTo') }}
              <span class="font-semibold text-ink">{{ result.email }}</span
              >. {{ locale.t('login.sentValidity') }}
            </p>
            @if (result.loginUrl; as url) {
              <a
                data-testid="dev-login-link"
                [href]="url"
                class="mt-5 block w-full rounded border border-kobalt bg-kobalt px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:border-kobalt-diep hover:bg-kobalt-diep"
              >
                {{ t('login.directLogin') }}
              </a>
              <p class="mt-2 text-xs leading-relaxed text-ink-faint">
                {{ locale.t('login.devHint') }}
              </p>
            } @else {
              <p class="mt-4 rounded border border-line bg-porselein px-3 py-2 text-xs leading-relaxed text-ink-muted">
                {{ locale.t('login.logHint') }}
              </p>
            }
            <button
              type="button"
              (click)="sent.set(null)"
              class="mt-4 text-sm font-semibold text-kobalt underline underline-offset-4 hover:text-kobalt-diep"
            >
              {{ t('login.otherEmail') }}
            </button>
          } @else {
            <p class="eyebrow">{{ t('login.eyebrow') }}</p>
            <h2 class="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
              {{ t('login.title') }}
            </h2>
            <p class="mt-2 mb-6 text-sm leading-relaxed text-ink-muted">
              {{ t('login.intro') }}
            </p>
            <form class="space-y-4" (submit)="submit($event)">
              <div>
                <label for="email" class="mb-1.5 block text-sm font-semibold text-ink">
                  {{ t('login.emailLabel') }}
                </label>
                <input
                  id="email"
                  type="email"
                  [ngModel]="email()"
                  (ngModelChange)="email.set($event)"
                  name="email"
                  placeholder="naam@organisatie.nl"
                  autocomplete="email"
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
                [disabled]="!email().trim() || busy()"
                class="w-full rounded border border-kobalt bg-kobalt px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-kobalt-diep hover:bg-kobalt-diep disabled:cursor-not-allowed disabled:border-line disabled:bg-porselein disabled:text-ink-faint"
              >
                {{ busy() ? t('login.submitBusy') : t('login.submit') }}
              </button>
            </form>
          }
        </div>
        <p class="mt-4 px-1 text-center text-xs leading-relaxed text-ink-muted">
          {{ t('login.privacy') }}
        </p>
      </div>
    </div>
  `,
})
export class LoginPage {
  private readonly api = inject(CadaApi);
  protected readonly locale = inject(LocaleStore);

  protected t(key: string): string {
    return this.locale.t(key);
  }

  protected readonly email = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sent = signal<MagicLinkResult | null>(null);

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.email().trim() || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      this.sent.set(await this.api.requestMagicLink(this.email().trim()));
    } catch (err) {
      this.error.set(CadaApi.errorMessage(err, 'Er ging iets mis. Probeer het opnieuw.'));
    } finally {
      this.busy.set(false);
    }
  }
}
