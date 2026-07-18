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
            class="inline-flex items-center gap-2 rounded border border-line-strong bg-wit px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-kobalt hover:text-kobalt"
          >
            <span aria-hidden="true">←</span>
            {{ backLabel() }}
          </a>
        }
      </div>
      <div class="flex items-center gap-3">
        @if (nextDisabled() && nextDisabledReason()) {
          <span class="text-xs text-ink-muted">{{ nextDisabledReason() }}</span>
        }
        @if (nextLink(); as link) {
          @if (nextDisabled()) {
            <span
              class="inline-flex cursor-not-allowed items-center gap-2 rounded border border-line bg-porselein px-4 py-2 text-sm font-medium text-ink-faint"
            >
              {{ nextLabel() }}
              <span aria-hidden="true">→</span>
            </span>
          } @else {
            <a
              [routerLink]="link"
              class="inline-flex items-center gap-2 rounded border border-kobalt bg-kobalt px-4 py-2 text-sm font-medium text-white transition-colors hover:border-kobalt-diep hover:bg-kobalt-diep"
            >
              {{ nextLabel() }}
              <span aria-hidden="true">→</span>
            </a>
          }
        }
      </div>
    </div>
  `,
})
export class StepNav {
  readonly backLink = input<string | null>(null);
  readonly backLabel = input('Vorige stap');
  readonly nextLink = input<string | null>(null);
  readonly nextLabel = input('Volgende stap');
  readonly nextDisabled = input(false);
  readonly nextDisabledReason = input('');
}
