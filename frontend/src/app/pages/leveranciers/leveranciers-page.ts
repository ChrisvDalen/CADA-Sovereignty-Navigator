import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { assessmentResource } from '../../core/assessment-resource';
import { checkCompliance, OTHER_SUPPLIER, type ComplianceResult } from '../../core/cada';
import type { ApplicationDto } from '../../core/types';
import { LevelBadge } from '../../shared/level-badge';
import { StepNav } from '../../shared/step-nav';
import { WizardShell } from '../../shared/wizard-shell';

interface SupplierSection {
  app: ApplicationDto;
  compliance: ComplianceResult;
}

@Component({
  selector: 'app-leveranciers-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LevelBadge, StepNav, WizardShell],
  templateUrl: './leveranciers-page.html',
})
export class LeveranciersPage {
  readonly id = input.required<string>();

  protected readonly assessmentRes = assessmentResource(this.id);
  protected readonly assessment = computed(() => this.assessmentRes.value() ?? null);

  protected readonly sections = computed<SupplierSection[]>(() =>
    (this.assessment()?.applications ?? []).map((app) => ({
      app,
      compliance: checkCompliance(app.suppliers, app.recommendedLevel),
    }))
  );

  protected displayName(app: ApplicationDto, supplierName: string): string {
    return supplierName === OTHER_SUPPLIER && app.supplierOther
      ? `${app.supplierOther} (eigen opgave)`
      : supplierName;
  }
}
