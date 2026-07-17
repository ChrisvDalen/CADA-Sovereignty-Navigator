import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LEVEL_INFO, type CadaLevel } from '../core/cada';

const STYLES: Record<CadaLevel, string> = {
  1: 'bg-navy-50 text-navy-600 border-navy-200',
  2: 'bg-navy-100 text-navy-700 border-navy-300',
  3: 'bg-navy-600 text-white border-navy-600',
  4: 'bg-navy-900 text-white border-navy-900',
};

@Component({
  selector: 'app-level-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1.5 border font-mono font-medium"
      [class]="classes()"
    >
      N{{ level() }}
      @if (showName()) {
        <span class="tracking-wide uppercase">{{ levelName() }}</span>
      }
    </span>
  `,
})
export class LevelBadge {
  readonly level = input.required<CadaLevel>();
  readonly showName = input(false);
  readonly size = input<'sm' | 'md'>('md');

  protected readonly levelName = computed(() => LEVEL_INFO[this.level()].name);
  protected readonly classes = computed(
    () =>
      `${STYLES[this.level()]} ${
        this.size() === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs'
      }`
  );
}
