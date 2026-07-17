import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { assessmentResource } from '../../core/assessment-resource';
import {
  berekenNiveau,
  DATA_TYPES,
  IMPACT_LEVELS,
  KNOWN_SUPPLIERS,
  OTHER_SUPPLIER,
  REGULATIONS,
  type CadaLevel,
  type DataTypeKey,
  type ImpactKey,
  type RegulationKey,
} from '../../core/cada';
import type { ApplicationDto } from '../../core/types';
import { LevelBadge } from '../../shared/level-badge';
import { StepNav } from '../../shared/step-nav';
import { WizardShell } from '../../shared/wizard-shell';

interface FormState {
  name: string;
  dataTypes: DataTypeKey[];
  regulations: RegulationKey[];
  impactLevel: ImpactKey | null;
  criticalInfra: boolean | null;
  suppliers: string[];
  supplierOther: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  dataTypes: [],
  regulations: [],
  impactLevel: null,
  criticalInfra: null,
  suppliers: [],
  supplierOther: '',
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

@Component({
  selector: 'app-toepassingen-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LevelBadge, StepNav, WizardShell],
  templateUrl: './toepassingen-page.html',
})
export class ToepassingenPage {
  readonly id = input.required<string>();

  private readonly api = inject(ApiService);

  protected readonly assessmentRes = assessmentResource(this.id);
  protected readonly assessment = computed(() => this.assessmentRes.value() ?? null);
  protected readonly applications = computed(
    () => this.assessment()?.applications ?? []
  );

  protected readonly dataTypes = DATA_TYPES;
  protected readonly regulations = REGULATIONS;
  protected readonly impactLevels = IMPACT_LEVELS;
  protected readonly supplierOptions = [...KNOWN_SUPPLIERS, OTHER_SUPPLIER];
  protected readonly otherSupplier = OTHER_SUPPLIER;

  /** null = formulier dicht, 'new' = nieuw, anders het id van de toepassing. */
  protected readonly editingId = signal<string | null>(null);
  protected readonly form = signal<FormState>(EMPTY_FORM);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly previewLevel = computed<CadaLevel | null>(() => {
    const form = this.form();
    if (form.dataTypes.length === 0 || form.impactLevel === null) return null;
    return berekenNiveau({
      dataTypes: form.dataTypes,
      regulations: form.regulations,
      impactLevel: form.impactLevel,
      criticalInfra: form.criticalInfra === true,
    });
  });

  protected impactLabel(app: ApplicationDto): string {
    return IMPACT_LEVELS.find((i) => i.key === app.impactLevel)?.label ?? '';
  }

  protected supplierNames(app: ApplicationDto): string {
    return app.suppliers
      .map((s) => (s === OTHER_SUPPLIER && app.supplierOther ? app.supplierOther : s))
      .join(', ');
  }

  protected openNew(): void {
    this.form.set(EMPTY_FORM);
    this.editingId.set('new');
    this.error.set(null);
  }

  protected openEdit(app: ApplicationDto): void {
    this.form.set({
      name: app.name,
      dataTypes: app.dataTypes,
      regulations: app.regulations,
      impactLevel: app.impactLevel,
      criticalInfra: app.criticalInfra,
      suppliers: app.suppliers,
      supplierOther: app.supplierOther,
    });
    this.editingId.set(app.id);
    this.error.set(null);
  }

  protected closeForm(): void {
    this.editingId.set(null);
    this.form.set(EMPTY_FORM);
    this.error.set(null);
  }

  protected setName(name: string): void {
    this.form.update((f) => ({ ...f, name }));
  }

  protected setSupplierOther(supplierOther: string): void {
    this.form.update((f) => ({ ...f, supplierOther }));
  }

  protected setImpact(impactLevel: ImpactKey): void {
    this.form.update((f) => ({ ...f, impactLevel }));
  }

  protected setCriticalInfra(criticalInfra: boolean): void {
    this.form.update((f) => ({ ...f, criticalInfra }));
  }

  protected toggleDataType(key: DataTypeKey): void {
    this.form.update((f) => ({ ...f, dataTypes: toggle(f.dataTypes, key) }));
  }

  protected toggleRegulation(key: RegulationKey): void {
    this.form.update((f) => ({ ...f, regulations: toggle(f.regulations, key) }));
  }

  protected toggleSupplier(name: string): void {
    this.form.update((f) => ({ ...f, suppliers: toggle(f.suppliers, name) }));
  }

  protected async save(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);

    const form = this.form();
    const payload = {
      name: form.name,
      dataTypes: form.dataTypes,
      regulations: form.regulations,
      impactLevel: form.impactLevel,
      criticalInfra: form.criticalInfra === true,
      suppliers: form.suppliers,
      supplierOther: form.supplierOther,
    };

    try {
      const editingId = this.editingId();
      if (editingId === 'new') {
        await this.api.createApplication(this.id(), payload);
      } else if (editingId) {
        await this.api.updateApplication(editingId, payload);
      }
      this.closeForm();
      this.assessmentRes.reload();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Opslaan is niet gelukt.');
    } finally {
      this.busy.set(false);
    }
  }

  protected async remove(app: ApplicationDto): Promise<void> {
    if (
      !window.confirm(`Weet u zeker dat u de toepassing "${app.name}" wilt verwijderen?`)
    ) {
      return;
    }
    try {
      await this.api.deleteApplication(app.id);
      if (this.editingId() === app.id) this.closeForm();
      this.assessmentRes.reload();
    } catch {
      // verwijderen mislukt: lijst blijft ongewijzigd
    }
  }
}
