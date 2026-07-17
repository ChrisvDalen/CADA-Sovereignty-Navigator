import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WIZARD_STEPS } from '../core/cada';

@Component({
  selector: 'app-wizard-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="flex min-h-screen flex-col">
      <header class="bg-navy-600 text-white">
        <div
          class="mx-auto flex w-full max-w-5xl items-baseline justify-between gap-4 px-6 py-3"
        >
          <a routerLink="/" class="flex items-baseline gap-3">
            <span class="font-serif text-lg font-semibold tracking-tight">
              CADA <span class="font-normal italic">Sovereignty Navigator</span>
            </span>
          </a>
          <span
            class="hidden truncate font-mono text-xs text-navy-200 sm:block"
            [title]="orgName()"
          >
            {{ orgName() }}
          </span>
        </div>
      </header>

      <nav aria-label="Voortgang" class="border-b border-line bg-card">
        <div class="mx-auto w-full max-w-5xl px-6">
          <p class="eyebrow pt-4">Stap {{ currentStep() }} van {{ steps.length }}</p>
          <ol class="flex flex-wrap gap-x-8 gap-y-1">
            @for (step of steps; track step.slug; let i = $index) {
              <li>
                <a
                  [routerLink]="['/assessment', assessmentId(), step.slug]"
                  [attr.aria-current]="i + 1 === currentStep() ? 'step' : null"
                  class="flex items-baseline gap-2 border-b-2 pb-3 pt-2 text-sm transition-colors"
                  [class]="
                    i + 1 === currentStep()
                      ? 'border-navy-600 font-semibold text-navy-600'
                      : i + 1 < currentStep()
                        ? 'border-transparent text-ink hover:border-navy-200'
                        : 'border-transparent text-ink-faint hover:border-line hover:text-ink-muted'
                  "
                >
                  <span class="font-mono text-xs">{{ pad(i + 1) }}</span>
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

  protected pad(n: number): string {
    return String(n).padStart(2, '0');
  }
}
