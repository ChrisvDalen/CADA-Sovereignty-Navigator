import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';

import { CadaApi } from '../../core/cada-api';
import { MetaStore } from '../../core/meta-store';
import { ApplicationDto, AssessmentDto } from '../../core/models';
import { StepNav } from '../../shared/step-nav';
import { WizardShell } from '../../shared/wizard-shell';
import { ApplicationsModule } from './applications-module';
import { ImportPanel } from './import-panel';

@Component({
  selector: 'app-toepassingen-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WizardShell, StepNav, ApplicationsModule, ImportPanel],
  template: `
    @if (assessment(); as assessment) {
      @if (metaStore.meta(); as meta) {
        <app-wizard-shell [assessmentId]="assessment.id" [orgName]="assessment.orgName" [currentStep]="1">
          <header class="mb-8 max-w-3xl">
            <p class="eyebrow">Module 1 · Toepassingsprofiler</p>
            <h1 class="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
              Profileer uw cloudtoepassingen
            </h1>
            <p class="mt-3 text-[15px] leading-relaxed text-ink-muted">
              Beantwoord per toepassing zes vragen over de data, de toepasselijke regelgeving en
              de impact bij incidenten. Op basis daarvan berekent de navigator het aanbevolen
              CADA-soevereiniteitsniveau. Voeg alle cloudtoepassingen van
              {{ assessment.orgName }} toe voordat u verdergaat.
            </p>
          </header>

          <div class="mb-8">
            <app-import-panel
              [assessmentId]="assessment.id"
              [meta]="meta"
              (imported)="onImported()"
            />
          </div>

          <app-applications-module
            [assessmentId]="assessment.id"
            [meta]="meta"
            [initialApplications]="assessment.applications"
            (changed)="applications.set($event)"
          />

          <app-step-nav
            backLink="/"
            backLabel="Terug naar start"
            [nextLink]="'/assessment/' + assessment.id + '/leveranciers'"
            nextLabel="Naar de leverancierstoets"
            [nextDisabled]="applications().length === 0"
            nextDisabledReason="Voeg eerst minimaal één toepassing toe."
          />
        </app-wizard-shell>
      }
    } @else if (notFound()) {
      <p class="mx-auto max-w-xl px-6 py-16 text-sm text-ink-muted">
        Sessie niet gevonden. <a href="/" class="text-kobalt underline">Terug naar start.</a>
      </p>
    }
  `,
})
export class ToepassingenPage {
  readonly id = input.required<string>();

  private readonly api = inject(CadaApi);
  protected readonly metaStore = inject(MetaStore);

  protected readonly assessment = signal<AssessmentDto | null>(null);
  protected readonly applications = signal<ApplicationDto[]>([]);
  protected readonly notFound = signal(false);

  constructor() {
    this.metaStore.load();
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });
  }

  private async load(id: string): Promise<void> {
    try {
      const assessment = await this.api.getAssessment(id);
      this.assessment.set(assessment);
      this.applications.set(assessment.applications);
    } catch {
      this.notFound.set(true);
    }
  }

  /** Na een import het dossier herladen, zodat de lijst de nieuwe rijen toont. */
  protected onImported(): void {
    this.load(this.id());
  }
}
