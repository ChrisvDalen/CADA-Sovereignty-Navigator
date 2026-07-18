import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';

import { CadaApi } from '../../core/cada-api';
import { MetaStore } from '../../core/meta-store';
import { ReportResponse } from '../../core/models';
import { StepNav } from '../../shared/step-nav';
import { WizardShell } from '../../shared/wizard-shell';

@Component({
  selector: 'app-export-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WizardShell, StepNav],
  template: `
    @if (report(); as report) {
      @if (metaStore.meta()) {
        <app-wizard-shell
          [assessmentId]="report.assessment.id"
          [orgName]="report.assessment.orgName"
          [currentStep]="4"
        >
          <header class="mb-8 max-w-3xl">
            <p class="eyebrow">Module 4 · Exporteren</p>
            <h1 class="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
              Exporteer uw rapportage
            </h1>
            <p class="mt-3 text-[15px] leading-relaxed text-ink-muted">
              Download het volledige gap-rapport voor {{ report.assessment.orgName }} als PDF of
              exporteer de onderliggende gegevens naar Excel. Beide bestanden worden lokaal in uw
              browser gegenereerd op basis van de door de server berekende analyse.
            </p>
          </header>

          <div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <div class="flex flex-col rounded-lg border border-line bg-wit p-6">
              <p class="font-mono text-xs font-medium text-kobalt">.PDF</p>
              <h2 class="mt-2 font-display text-xl font-semibold text-ink">Rapport als PDF</h2>
              <p class="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                Professioneel opgemaakt rapport met voorpagina, inhoudsopgave, samenvattingstabel,
                uitleg per CADA-niveau, prioriteitenmatrix en aanbevelingen. Geschikt om te delen
                met bestuur en toezichthouders.
              </p>
              <button
                type="button"
                (click)="downloadPdf()"
                [disabled]="disabled() || busy() !== null"
                class="mt-5 w-full rounded border border-kobalt bg-kobalt px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-kobalt-diep disabled:cursor-not-allowed disabled:border-line disabled:bg-porselein disabled:text-ink-faint"
              >
                {{ busy() === 'pdf' ? 'PDF wordt gegenereerd…' : 'PDF exporteren' }}
              </button>
            </div>

            <div class="flex flex-col rounded-lg border border-line bg-wit p-6">
              <p class="font-mono text-xs font-medium text-kobalt">.XLSX</p>
              <h2 class="mt-2 font-display text-xl font-semibold text-ink">Gegevens als Excel</h2>
              <p class="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                Alle toepassingen, niveaus, leveranciers en aanbevelingen in één tabel (één rij
                per toepassing), gesorteerd op prioriteit. Geschikt voor eigen analyses en
                projectplanning.
              </p>
              <button
                type="button"
                (click)="downloadExcel()"
                [disabled]="disabled() || busy() !== null"
                class="mt-5 w-full rounded border border-kobalt bg-wit px-4 py-2.5 text-sm font-semibold text-kobalt transition-colors hover:bg-kobalt-50 disabled:cursor-not-allowed disabled:border-line disabled:text-ink-faint"
              >
                {{ busy() === 'excel' ? 'Excel wordt gegenereerd…' : 'Excel exporteren' }}
              </button>
            </div>

            <div class="flex flex-col rounded-lg border border-line bg-wit p-6">
              <p class="font-mono text-xs font-medium text-kobalt">.DOCX</p>
              <h2 class="mt-2 font-display text-xl font-semibold text-ink">Rapport als Word</h2>
              <p class="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                Bewerkbaar rapport met samenvattingstabel, roadmap per fase en aanbevelingen.
                Geschikt om op te nemen in uw eigen rapportagesjablonen.
              </p>
              <button
                type="button"
                (click)="downloadWord()"
                [disabled]="disabled() || busy() !== null"
                class="mt-5 w-full rounded border border-kobalt bg-wit px-4 py-2.5 text-sm font-semibold text-kobalt transition-colors hover:bg-kobalt-50 disabled:cursor-not-allowed disabled:border-line disabled:text-ink-faint"
              >
                {{ busy() === 'word' ? 'Word wordt gegenereerd…' : 'Word exporteren' }}
              </button>
            </div>

            @if (error(); as message) {
              <p
                class="rounded border border-alert/30 bg-alert-bg px-3 py-2 text-sm text-alert md:col-span-2"
              >
                {{ message }}
              </p>
            }
            @if (disabled()) {
              <p class="text-sm text-ink-muted md:col-span-2">
                Voeg eerst minimaal één toepassing toe om te kunnen exporteren.
              </p>
            }
          </div>

          <div class="mt-8 rounded-lg border border-line bg-wit px-5 py-4">
            <p class="text-xs leading-relaxed text-ink-muted">
              <span class="font-semibold text-ink">Disclaimer.</span> Dit rapport is indicatief.
              Raadpleeg altijd een juridisch adviseur voor bindende interpretatie van de CADA.
            </p>
          </div>

          <app-step-nav
            [backLink]="'/assessment/' + report.assessment.id + '/rapport'"
            backLabel="Terug naar het rapport"
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
export class ExportPage {
  readonly id = input.required<string>();

  private readonly api = inject(CadaApi);
  protected readonly metaStore = inject(MetaStore);

  protected readonly report = signal<ReportResponse | null>(null);
  protected readonly notFound = signal(false);
  protected readonly busy = signal<'pdf' | 'excel' | 'word' | null>(null);
  protected readonly error = signal<string | null>(null);

  protected disabled(): boolean {
    return (this.report()?.rows.length ?? 0) === 0;
  }

  constructor() {
    this.metaStore.load();
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });
  }

  private async load(id: string): Promise<void> {
    try {
      this.report.set(await this.api.getReport(id));
    } catch {
      this.notFound.set(true);
    }
  }

  protected async downloadPdf(): Promise<void> {
    const report = this.report();
    const meta = this.metaStore.meta();
    if (!report || !meta || this.busy() || this.disabled()) return;
    this.busy.set('pdf');
    this.error.set(null);
    try {
      // Lazy import houdt jsPDF buiten de initiële bundel.
      const { exportPdf } = await import('./pdf-export');
      exportPdf(report, meta);
    } catch {
      this.error.set('Het PDF-rapport kon niet worden gegenereerd.');
    } finally {
      this.busy.set(null);
    }
  }

  protected async downloadWord(): Promise<void> {
    const report = this.report();
    const meta = this.metaStore.meta();
    if (!report || !meta || this.busy() || this.disabled()) return;
    this.busy.set('word');
    this.error.set(null);
    try {
      const { exportWord } = await import('./word-export');
      await exportWord(report, meta);
    } catch {
      this.error.set('Het Word-document kon niet worden gegenereerd.');
    } finally {
      this.busy.set(null);
    }
  }

  protected async downloadExcel(): Promise<void> {
    const report = this.report();
    const meta = this.metaStore.meta();
    if (!report || !meta || this.busy() || this.disabled()) return;
    this.busy.set('excel');
    this.error.set(null);
    try {
      const { exportExcel } = await import('./excel-export');
      exportExcel(report, meta);
    } catch {
      this.error.set('Het Excel-bestand kon niet worden gegenereerd.');
    } finally {
      this.busy.set(null);
    }
  }
}
