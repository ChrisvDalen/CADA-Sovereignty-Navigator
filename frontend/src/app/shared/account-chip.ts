import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthStore } from '../core/auth-store';
import { LocaleStore } from '../core/i18n';

/** Toont de aangemelde gebruiker met een afmeldknop (voor donkere headers). */
@Component({
  selector: 'app-account-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.user(); as user) {
      <span class="flex items-center gap-3 font-mono text-xs text-kobalt-200">
        <span class="hidden truncate sm:inline" [title]="user.email">{{ user.email }}</span>
        <button
          type="button"
          (click)="logout()"
          class="rounded border border-white/25 px-2 py-1 font-sans font-semibold text-white transition-colors hover:border-white/60"
        >
          {{ locale.t('common.signOut') }}
        </button>
      </span>
    }
  `,
})
export class AccountChip {
  protected readonly store = inject(AuthStore);
  protected readonly locale = inject(LocaleStore);
  private readonly router = inject(Router);

  constructor() {
    this.store.ensureLoaded();
  }

  protected async logout(): Promise<void> {
    await this.store.logout();
    await this.router.navigateByUrl('/login');
  }
}
