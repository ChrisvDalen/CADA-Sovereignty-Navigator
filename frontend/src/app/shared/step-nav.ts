import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-step-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div
      class="no-print mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6"
    >
      <div>
        @if (backLink(); as link) {
          <a
            [routerLink]="link"
            class="inline-flex items-center gap-2 border border-line-strong bg-card px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-navy-600 hover:text-navy-600"
          >
            <span aria-hidden="true">←</span>
            {{ backLabel() ?? 'Vorige stap' }}
          </a>
        }
      </div>
      <div class="flex items-center gap-3">
        @if (nextDisabled() && nextDisabledReason(); as reason) {
          <span class="text-xs text-ink-muted">{{ reason }}</span>
        }
        @if (nextLink(); as link) {
          @if (nextDisabled()) {
            <span
              class="inline-flex cursor-not-allowed items-center gap-2 border border-line bg-paper px-4 py-2 text-sm font-medium text-ink-faint"
            >
              {{ nextLabel() ?? 'Volgende stap' }}
              <span aria-hidden="true">→</span>
            </span>
          } @else {
            <a
              [routerLink]="link"
              class="inline-flex items-center gap-2 border border-navy-600 bg-navy-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-700"
            >
              {{ nextLabel() ?? 'Volgende stap' }}
              <span aria-hidden="true">→</span>
            </a>
          }
        }
      </div>
    </div>
  `,
})
export class StepNav {
  readonly backLink = input<string | string[] | null>(null);
  readonly backLabel = input<string | null>(null);
  readonly nextLink = input<string | string[] | null>(null);
  readonly nextLabel = input<string | null>(null);
  readonly nextDisabled = input(false);
  readonly nextDisabledReason = input<string | null>(null);
}
