import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthStore } from '../../core/auth-store';
import { CadaApi } from '../../core/cada-api';

/** Wisselt het magic-link-token uit de URL in voor een sessie. */
@Component({
  selector: 'app-verify-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-porselein px-6 py-12">
      <div
        class="w-full max-w-md rounded-lg border border-line bg-wit p-6 text-center shadow-[0_1px_2px_rgba(11,21,65,0.06)] sm:p-8"
      >
        @if (error(); as message) {
          <p class="eyebrow">Aanmelden mislukt</p>
          <p class="mt-3 text-sm leading-relaxed text-ink-muted">{{ message }}</p>
          <a
            routerLink="/login"
            class="mt-5 inline-block rounded border border-kobalt bg-kobalt px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-kobalt-diep hover:bg-kobalt-diep"
          >
            Nieuwe aanmeldlink aanvragen
          </a>
        } @else {
          <p class="eyebrow">Eén moment</p>
          <p class="mt-3 text-sm text-ink-muted">Bezig met aanmelden…</p>
        }
      </div>
    </div>
  `,
})
export class VerifyPage {
  readonly token = input<string>('');

  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly error = signal<string | null>(null);

  constructor() {
    // Token wordt via de query-parameter gebonden; na binding direct inwisselen.
    effect(() => {
      const token = this.token();
      untracked(() => this.verify(token));
    });
  }

  private async verify(token: string): Promise<void> {
    if (!token) {
      this.error.set('Deze aanmeldlink is onvolledig. Vraag een nieuwe aan.');
      return;
    }
    try {
      await this.store.completeLogin(token);
      await this.router.navigateByUrl('/');
    } catch (err) {
      this.error.set(
        CadaApi.errorMessage(err, 'De aanmeldlink is ongeldig of verlopen. Vraag een nieuwe aan.'),
      );
    }
  }
}
