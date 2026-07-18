import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-status-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (status()) {
      @case ('OK') {
        <span
          class="inline-flex items-center gap-1.5 rounded border border-ok/30 bg-ok-bg px-2 py-0.5 font-mono text-[11px] font-semibold text-ok"
        >
          ✓ OK
        </span>
      }
      @case ('GAP') {
        <span
          class="inline-flex items-center gap-1.5 rounded border border-alert/30 bg-alert-bg px-2 py-0.5 font-mono text-[11px] font-semibold text-alert"
        >
          ✕ GAP
        </span>
      }
      @default {
        <span
          class="inline-flex items-center gap-1.5 rounded border border-warn/40 bg-warn-bg px-2 py-0.5 font-mono text-[11px] font-semibold text-warn"
        >
          ? ONBEKEND
        </span>
      }
    }
  `,
})
export class StatusChip {
  readonly status = input.required<'OK' | 'GAP' | 'ONBEKEND'>();
}
