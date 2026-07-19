import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { MetaStore } from '../core/meta-store';
import { CadaLevel } from '../core/models';

interface Bar {
  level: CadaLevel;
  name: string;
  count: number;
  percent: number;
}

/** Kleur per niveau: oplopend donkerder, net als de soevereiniteitsladder. */
const LEVEL_FILL: Record<CadaLevel, string> = {
  1: 'var(--color-kobalt-200)',
  2: 'var(--color-kobalt)',
  3: 'var(--color-kobalt-diep)',
  4: 'var(--color-nacht)',
};

/**
 * Toegankelijke horizontale staafgrafiek van de niveauverdeling. De balken
 * dragen ook een tekstlabel met het aantal, zodat de grafiek zonder kleur
 * leesbaar blijft.
 */
@Component({
  selector: 'app-level-distribution-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (total() > 0) {
      <div class="space-y-2">
        @for (bar of bars(); track bar.level) {
          <div class="flex items-center gap-3">
            <span class="w-8 shrink-0 font-mono text-xs font-medium text-ink">N{{ bar.level }}</span>
            <span class="hidden w-28 shrink-0 truncate text-xs text-ink-muted sm:block">
              {{ bar.name }}
            </span>
            <div
              class="relative h-5 flex-1 overflow-hidden rounded bg-porselein"
              role="img"
              [attr.aria-label]="bar.name + ': ' + bar.count + ' toepassing(en)'"
            >
              <div
                class="h-full rounded transition-[width]"
                [style.width.%]="bar.percent"
                [style.background]="fill(bar.level)"
              ></div>
            </div>
            <span class="w-8 shrink-0 text-right font-mono text-xs text-ink">{{ bar.count }}</span>
          </div>
        }
      </div>
    } @else {
      <p class="text-sm text-ink-faint">Nog geen geprofileerde toepassingen.</p>
    }
  `,
})
export class LevelDistributionChart {
  /** Aantal per niveau, bijv. { "1": 3, "3": 5 }. */
  readonly counts = input.required<Record<string, number>>();

  private readonly metaStore = inject(MetaStore);

  protected readonly total = computed(() =>
    Object.values(this.counts()).reduce((sum, n) => sum + n, 0),
  );

  protected readonly bars = computed<Bar[]>(() => {
    const counts = this.counts();
    const max = Math.max(1, ...Object.values(counts));
    return ([1, 2, 3, 4] as CadaLevel[]).map((level) => {
      const count = counts[String(level)] ?? 0;
      return {
        level,
        name: this.metaStore.levelInfo(level).name,
        count,
        percent: (count / max) * 100,
      };
    });
  });

  protected fill(level: CadaLevel): string {
    return LEVEL_FILL[level];
  }
}
