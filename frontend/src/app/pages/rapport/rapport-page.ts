import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { assessmentResource } from '../../core/assessment-resource';
import { buildReportRows, prioritized, type ReportRow } from '../../core/report';
import { LevelBadge } from '../../shared/level-badge';
import { StatusChip } from '../../shared/status-chip';
import { StepNav } from '../../shared/step-nav';
import { WizardShell } from '../../shared/wizard-shell';

@Component({
  selector: 'app-rapport-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LevelBadge, StatusChip, StepNav, WizardShell],
  templateUrl: './rapport-page.html',
})
export class RapportPage {
  readonly id = input.required<string>();

  protected readonly assessmentRes = assessmentResource(this.id);
  protected readonly assessment = computed(() => this.assessmentRes.value() ?? null);

  protected readonly rows = computed<ReportRow[]>(() => {
    const assessment = this.assessment();
    return assessment ? buildReportRows(assessment) : [];
  });
  protected readonly priorityRows = computed(() => prioritized(this.rows()));
  protected readonly gaps = computed(
    () => this.rows().filter((r) => r.statusLabel === 'GAP').length
  );

  protected readonly summary = computed(() => {
    const count = this.rows().length;
    const gaps = this.gaps();
    const analysed =
      count === 1
        ? 'Eén toepassing is geanalyseerd'
        : `${count} toepassingen zijn geanalyseerd`;
    const gapText =
      gaps === 0
        ? '; er zijn geen compliance-gaps gevonden.'
        : gaps === 1
          ? '; bij één toepassing is een compliance-gap gevonden.'
          : `; bij ${gaps} toepassingen is een compliance-gap gevonden.`;
    return analysed + gapText;
  });

  protected pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  protected gapLabel(row: ReportRow): string {
    return row.compliance.gap > 0
      ? `${row.compliance.gap} niveau${row.compliance.gap > 1 ? 's' : ''}`
      : 'geen';
  }
}
