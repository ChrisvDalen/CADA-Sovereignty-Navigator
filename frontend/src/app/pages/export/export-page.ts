import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { assessmentResource } from '../../core/assessment-resource';
import { StepNav } from '../../shared/step-nav';
import { WizardShell } from '../../shared/wizard-shell';

@Component({
  selector: 'app-export-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StepNav, WizardShell],
  templateUrl: './export-page.html',
})
export class ExportPage {
  readonly id = input.required<string>();

  protected readonly assessmentRes = assessmentResource(this.id);
  protected readonly assessment = computed(() => this.assessmentRes.value() ?? null);
  protected readonly disabled = computed(
    () => (this.assessment()?.applications.length ?? 0) === 0
  );

  protected readonly busy = signal<'pdf' | 'excel' | null>(null);
  protected readonly error = signal<string | null>(null);

  protected async exportPdf(): Promise<void> {
    const assessment = this.assessment();
    if (!assessment || this.busy() || this.disabled()) return;
    this.busy.set('pdf');
    this.error.set(null);
    try {
      const { exportPdf } = await import('../../core/export/pdf');
      exportPdf(assessment);
    } catch {
      this.error.set('Het PDF-rapport kon niet worden gegenereerd.');
    } finally {
      this.busy.set(null);
    }
  }

  protected async exportExcel(): Promise<void> {
    const assessment = this.assessment();
    if (!assessment || this.busy() || this.disabled()) return;
    this.busy.set('excel');
    this.error.set(null);
    try {
      const { exportExcel } = await import('../../core/export/excel');
      exportExcel(assessment);
    } catch {
      this.error.set('Het Excel-bestand kon niet worden gegenereerd.');
    } finally {
      this.busy.set(null);
    }
  }
}
