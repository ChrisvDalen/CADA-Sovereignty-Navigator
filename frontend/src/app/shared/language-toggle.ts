import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { LocaleStore } from '../core/i18n';

/**
 * Schakelt tussen Nederlands en Engels. Twee varianten: 'dark' voor de
 * donkere headers, 'light' voor lichte achtergronden.
 */
@Component({
  selector: 'app-language-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      (click)="locale.toggle()"
      [attr.aria-label]="'Switch to ' + locale.t('lang.switchTo')"
      class="rounded border px-2 py-1 font-mono text-xs font-semibold transition-colors"
      [class]="
        variant() === 'dark'
          ? 'border-white/25 text-white hover:border-white/60'
          : 'border-line-strong text-ink-muted hover:border-kobalt hover:text-kobalt'
      "
    >
      {{ locale.lang() === 'nl' ? 'EN' : 'NL' }}
    </button>
  `,
})
export class LanguageToggle {
  readonly variant = input<'dark' | 'light'>('dark');
  protected readonly locale = inject(LocaleStore);
}
