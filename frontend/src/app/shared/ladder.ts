import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CadaLevel } from '../core/models';

/**
 * De Soevereiniteitsladder: vier oplopende balken, goud gevuld tot en met
 * het niveau. Dit glyph is de enige plek in de interface waar goud
 * voorkomt — de kleur zelf codeert dus het soevereiniteitsniveau.
 */
@Component({
  selector: 'app-ladder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      aria-hidden="true"
      class="ladder"
      [class.ladder-lg]="size() === 'lg'"
      [class.ladder-animate]="animate()"
    >
      @for (step of steps; track step) {
        <i [class.vol]="step <= level()" [class.leeg]="step > level()"></i>
      }
    </span>
  `,
})
export class Ladder {
  readonly level = input.required<CadaLevel>();
  readonly size = input<'sm' | 'lg'>('sm');
  readonly animate = input(false);

  protected readonly steps = [1, 2, 3, 4] as const;
}
