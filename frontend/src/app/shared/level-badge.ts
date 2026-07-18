import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { MetaStore } from '../core/meta-store';
import { CadaLevel } from '../core/models';
import { Ladder } from './ladder';

@Component({
  selector: 'app-level-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Ladder],
  template: `
    <span
      [title]="info().title"
      class="inline-flex items-center gap-1.5 rounded border border-line bg-wit font-mono font-medium text-ink"
      [class]="size() === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs'"
    >
      <app-ladder [level]="level()" />
      N{{ level() }}
      @if (showName()) {
        <span class="tracking-wide uppercase text-ink-muted">{{ info().name }}</span>
      }
    </span>
  `,
})
export class LevelBadge {
  readonly level = input.required<CadaLevel>();
  readonly showName = input(false);
  readonly size = input<'sm' | 'md'>('md');

  private readonly metaStore = inject(MetaStore);

  protected readonly info = computed(() => this.metaStore.levelInfo(this.level()));
}
