import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { WIZARD_STEPS } from './wizard-steps';

@Component({
  selector: 'app-wizard-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="flex min-h-screen flex-col">
      <header class="on-dark bg-nacht text-white">
        <div class="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <a routerLink="/" class="flex items-center gap-2.5">
            <span class="font-display text-lg font-bold tracking-tight">
              CADA Sovereignty Navigator
            </span>
          </a>
          <span
            class="hidden truncate font-mono text-xs text-kobalt-200 sm:block"
            [title]="orgName()"
          >
            Dossier · {{ orgName() }}
          </span>
        </div>
      </header>

      <nav aria-label="Voortgang" class="border-b border-line bg-wit">
        <div class="mx-auto w-full max-w-5xl px-6">
          <p class="eyebrow pt-4">Stap {{ currentStep() }} van {{ steps.length }}</p>
          <ol class="flex flex-wrap gap-x-8 gap-y-1">
            @for (step of steps; track step.slug; let i = $index) {
              @let n = i + 1;
              @let active = n === currentStep();
              @let done = n < currentStep();
              <li>
                <a
                  [routerLink]="['/assessment', assessmentId(), step.slug]"
                  [attr.aria-current]="active ? 'step' : null"
                  class="flex items-baseline gap-2 border-b-2 pb-3 pt-2 text-sm transition-colors"
                  [class]="
                    active
                      ? 'border-kobalt font-semibold text-kobalt'
                      : done
                        ? 'border-transparent text-ink hover:border-kobalt-200'
                        : 'border-transparent text-ink-faint hover:border-line hover:text-ink-muted'
                  "
                >
                  <span class="font-mono text-xs">{{ n < 10 ? '0' + n : n }}</span>
                  {{ step.label }}
                </a>
              </li>
            }
          </ol>
        </div>
      </nav>

      <main class="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <ng-content />
      </main>

      <footer class="border-t border-line">
        <div
          class="mx-auto flex w-full max-w-5xl flex-wrap items-baseline justify-between gap-2 px-6 py-4 text-xs text-ink-muted"
        >
          <span>
            CADA Sovereignty Navigator — indicatief instrument, geen juridisch advies.
          </span>
          <span class="font-mono">
            Cloud and AI Development Act · van kracht per augustus 2026
          </span>
        </div>
      </footer>
    </div>
  `,
})
export class WizardShell {
  readonly assessmentId = input.required<string>();
  readonly orgName = input.required<string>();
  readonly currentStep = input.required<number>();

  protected readonly steps = WIZARD_STEPS;
}
