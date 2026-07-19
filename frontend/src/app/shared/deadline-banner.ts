import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { deadlineStatus } from '../core/deadline';
import { LocaleStore } from '../core/i18n';

/** Compacte teller richting de CADA-deadline (augustus 2026). */
@Component({
  selector: 'app-deadline-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-2 rounded border border-goud/40 bg-goud/10 px-3 py-1 text-xs font-medium text-ink"
    >
      <span aria-hidden="true" class="h-1.5 w-1.5 rounded-full bg-goud"></span>
      {{ locale.t('deadline.prefix') }}
      <span class="font-semibold">{{ statusText() }}</span>
    </span>
  `,
})
export class DeadlineBanner {
  protected readonly locale = inject(LocaleStore);

  protected readonly statusText = computed(() => {
    const status = deadlineStatus();
    if (status.days === 0) return this.locale.t('deadline.today');
    if (status.passed) return this.locale.t('deadline.passed', { days: Math.abs(status.days) });
    return this.locale.t('deadline.daysLeft', { days: status.days });
  });
}
