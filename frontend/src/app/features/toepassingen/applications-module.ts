import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CadaApi } from '../../core/cada-api';
import { MetaStore } from '../../core/meta-store';
import { ApplicationDto, ApplicationPayload, LevelPreview, Meta } from '../../core/models';
import { LevelBadge } from '../../shared/level-badge';

interface FormState {
  name: string;
  dataTypes: string[];
  regulations: string[];
  impactLevel: string | null;
  criticalInfra: boolean | null;
  aiProcessing: boolean | null;
  suppliers: string[];
  supplierOther: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  dataTypes: [],
  regulations: [],
  impactLevel: null,
  criticalInfra: null,
  aiProcessing: null,
  suppliers: [],
  supplierOther: '',
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

@Component({
  selector: 'app-applications-module',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LevelBadge],
  template: `
    <div class="space-y-8">
      <!-- Overzicht van toegevoegde toepassingen -->
      @if (applications().length > 0) {
        <div class="overflow-hidden rounded-lg border border-line bg-wit">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-line text-left">
                <th class="eyebrow px-4 py-3 font-medium">Toepassing</th>
                <th class="eyebrow hidden px-4 py-3 font-medium md:table-cell">Impact</th>
                <th class="eyebrow hidden px-4 py-3 font-medium md:table-cell">Leveranciers</th>
                <th class="eyebrow px-4 py-3 font-medium">Niveau</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              @for (app of applications(); track app.id) {
                <tr class="align-top">
                  <td class="px-4 py-3">
                    <span class="font-semibold text-ink">{{ app.name }}</span>
                    @if (app.criticalInfra) {
                      <span
                        class="ml-2 rounded border border-warn/40 bg-warn-bg px-1.5 py-0.5 text-[11px] font-medium text-warn"
                      >
                        Kritieke infra
                      </span>
                    }
                  </td>
                  <td class="hidden px-4 py-3 text-ink-muted md:table-cell">
                    {{ metaStore.impactLabel(app.impactLevel) }}
                  </td>
                  <td class="hidden max-w-56 px-4 py-3 text-ink-muted md:table-cell">
                    {{ metaStore.supplierDisplayNames(app.suppliers, app.supplierOther).join(', ') }}
                  </td>
                  <td class="px-4 py-3">
                    <app-level-badge [level]="app.recommendedLevel" />
                  </td>
                  <td class="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      (click)="openEdit(app)"
                      class="text-sm font-medium text-kobalt underline-offset-4 hover:underline"
                    >
                      Bewerken
                    </button>
                    <button
                      type="button"
                      (click)="remove(app)"
                      class="ml-4 text-sm font-medium text-alert underline-offset-4 hover:underline"
                    >
                      Verwijderen
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (!formOpen()) {
        <button
          type="button"
          (click)="openNew()"
          class="inline-flex items-center gap-2 rounded border border-kobalt bg-kobalt px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-kobalt-diep hover:bg-kobalt-diep"
        >
          <span aria-hidden="true" class="font-mono">+</span>
          Toepassing toevoegen
        </button>
      }

      <!-- Vragenlijst -->
      @if (formOpen()) {
        <form
          (submit)="save($event)"
          class="overflow-hidden rounded-lg border border-line bg-wit"
          aria-label="Toepassingsprofiel"
        >
          <div
            class="flex items-baseline justify-between gap-4 border-b border-line px-5 py-4 sm:px-7"
          >
            <h2 class="font-display text-xl font-semibold tracking-tight text-ink">
              {{ editingId() === 'new' ? 'Nieuwe toepassing profileren' : 'Toepassing bewerken' }}
            </h2>
            <button
              type="button"
              (click)="closeForm()"
              class="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Annuleren
            </button>
          </div>

          <div class="space-y-8 px-5 py-6 sm:px-7">
            <!-- 1. Naam -->
            <section>
              <label for="appName" class="block">
                <span class="eyebrow">Vraag 1 van 7</span>
                <span class="mt-1 block text-sm font-semibold text-ink">
                  Naam van de toepassing
                </span>
              </label>
              <input
                id="appName"
                type="text"
                name="appName"
                [ngModel]="form().name"
                (ngModelChange)="patch({ name: $event })"
                placeholder="Bijv. Zaaksysteem, DMS, e-maildienst"
                class="{{ inputBase }} mt-2 max-w-md"
              />
            </section>

            <!-- 2. Type data -->
            <section>
              <p class="eyebrow">Vraag 2 van 7</p>
              <p class="mt-1 text-sm font-semibold text-ink">
                Welk type data verwerkt deze toepassing?
              </p>
              <p class="text-xs text-ink-muted">Meerdere opties mogelijk.</p>
              <div class="mt-3 grid gap-2 sm:grid-cols-2">
                @for (dt of meta().dataTypes; track dt.key) {
                  @let checked = form().dataTypes.includes(dt.key);
                  <label
                    class="flex cursor-pointer gap-3 rounded border px-3 py-2.5 transition-colors"
                    [class]="
                      checked ? 'border-kobalt bg-kobalt-50' : 'border-line hover:border-line-strong'
                    "
                  >
                    <input
                      type="checkbox"
                      [checked]="checked"
                      (change)="patch({ dataTypes: toggleValue(form().dataTypes, dt.key) })"
                      class="mt-1 h-3.5 w-3.5 shrink-0 accent-kobalt"
                    />
                    <span>
                      <span class="block text-sm font-medium text-ink">{{ dt.label }}</span>
                      <span class="block text-xs leading-snug text-ink-muted">{{ dt.hint }}</span>
                    </span>
                  </label>
                }
              </div>
            </section>

            <!-- 3. Regelgeving -->
            <section>
              <p class="eyebrow">Vraag 3 van 7</p>
              <p class="mt-1 text-sm font-semibold text-ink">
                Welke wet- en regelgeving is van toepassing?
              </p>
              <p class="text-xs text-ink-muted">Meerdere opties mogelijk.</p>
              <div class="mt-3 grid gap-2 sm:grid-cols-2">
                @for (reg of meta().regulations; track reg.key) {
                  @let checked = form().regulations.includes(reg.key);
                  <label
                    class="flex cursor-pointer items-center gap-3 rounded border px-3 py-2.5 transition-colors"
                    [class]="
                      checked ? 'border-kobalt bg-kobalt-50' : 'border-line hover:border-line-strong'
                    "
                  >
                    <input
                      type="checkbox"
                      [checked]="checked"
                      (change)="patch({ regulations: toggleValue(form().regulations, reg.key) })"
                      class="h-3.5 w-3.5 shrink-0 accent-kobalt"
                    />
                    <span class="text-sm font-medium text-ink">{{ reg.label }}</span>
                  </label>
                }
              </div>
            </section>

            <!-- 4. Impact -->
            <section>
              <p class="eyebrow">Vraag 4 van 7</p>
              <p class="mt-1 text-sm font-semibold text-ink">
                Wat is de impact bij een datalek of uitval?
              </p>
              <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                @for (impact of meta().impactLevels; track impact.key) {
                  @let checked = form().impactLevel === impact.key;
                  <label
                    class="flex cursor-pointer gap-3 rounded border px-3 py-2.5 transition-colors"
                    [class]="
                      checked ? 'border-kobalt bg-kobalt-50' : 'border-line hover:border-line-strong'
                    "
                  >
                    <input
                      type="radio"
                      name="impact"
                      [checked]="checked"
                      (change)="patch({ impactLevel: impact.key })"
                      class="mt-1 h-3.5 w-3.5 shrink-0 accent-kobalt"
                    />
                    <span>
                      <span class="block text-sm font-medium text-ink">{{ impact.label }}</span>
                      <span class="block text-xs leading-snug text-ink-muted">
                        {{ impact.description }}
                      </span>
                    </span>
                  </label>
                }
              </div>
            </section>

            <!-- 5. Kritieke infrastructuur -->
            <section>
              <p class="eyebrow">Vraag 5 van 7</p>
              <p class="mt-1 text-sm font-semibold text-ink">
                Is de toepassing onderdeel van kritieke infrastructuur?
              </p>
              <div class="mt-3 flex gap-2">
                @for (opt of criticalInfraOptions; track opt.label) {
                  @let checked = form().criticalInfra === opt.value;
                  <label
                    class="flex cursor-pointer items-center gap-2.5 rounded border px-5 py-2.5 transition-colors"
                    [class]="
                      checked ? 'border-kobalt bg-kobalt-50' : 'border-line hover:border-line-strong'
                    "
                  >
                    <input
                      type="radio"
                      name="criticalInfra"
                      [checked]="checked"
                      (change)="patch({ criticalInfra: opt.value })"
                      class="h-3.5 w-3.5 accent-kobalt"
                    />
                    <span class="text-sm font-medium text-ink">{{ opt.label }}</span>
                  </label>
                }
              </div>
            </section>

            <!-- 6. AI-verwerking -->
            <section>
              <p class="eyebrow">Vraag 6 van 7</p>
              <p class="mt-1 text-sm font-semibold text-ink">
                Past de toepassing AI-verwerking toe (bijv. machine learning, profilering of
                generatieve AI)?
              </p>
              <p class="text-xs text-ink-muted">
                De CADA stelt aanvullende eisen aan AI-verwerking van persoonsgegevens.
              </p>
              <div class="mt-3 flex gap-2">
                @for (opt of criticalInfraOptions; track opt.label) {
                  @let checked = form().aiProcessing === opt.value;
                  <label
                    class="flex cursor-pointer items-center gap-2.5 rounded border px-5 py-2.5 transition-colors"
                    [class]="
                      checked ? 'border-kobalt bg-kobalt-50' : 'border-line hover:border-line-strong'
                    "
                  >
                    <input
                      type="radio"
                      name="aiProcessing"
                      [checked]="checked"
                      (change)="patch({ aiProcessing: opt.value })"
                      class="h-3.5 w-3.5 accent-kobalt"
                    />
                    <span class="text-sm font-medium text-ink">{{ opt.label }}</span>
                  </label>
                }
              </div>
            </section>

            <!-- 7. Leveranciers -->
            <section>
              <p class="eyebrow">Vraag 7 van 7</p>
              <p class="mt-1 text-sm font-semibold text-ink">
                Bij welke cloudleverancier(s) draait deze toepassing?
              </p>
              <p class="text-xs text-ink-muted">Meerdere opties mogelijk.</p>
              <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                @for (supplier of supplierOptions(); track supplier) {
                  @let checked = form().suppliers.includes(supplier);
                  <label
                    class="flex cursor-pointer items-center gap-3 rounded border px-3 py-2.5 transition-colors"
                    [class]="
                      checked ? 'border-kobalt bg-kobalt-50' : 'border-line hover:border-line-strong'
                    "
                  >
                    <input
                      type="checkbox"
                      [checked]="checked"
                      (change)="patch({ suppliers: toggleValue(form().suppliers, supplier) })"
                      class="h-3.5 w-3.5 shrink-0 accent-kobalt"
                    />
                    <span class="text-sm font-medium text-ink">{{ supplier }}</span>
                  </label>
                }
              </div>
              @if (form().suppliers.includes(meta().otherSupplier)) {
                <input
                  type="text"
                  name="supplierOther"
                  [ngModel]="form().supplierOther"
                  (ngModelChange)="patch({ supplierOther: $event })"
                  placeholder="Naam van de andere leverancier"
                  aria-label="Naam van de andere leverancier"
                  class="{{ inputBase }} mt-2 max-w-md"
                />
              }
            </section>
          </div>

          <!-- Voorlopige niveau-indicatie + acties -->
          <div
            class="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-porselein px-5 py-4 sm:px-7"
          >
            <div class="flex items-center gap-3">
              @if (previewLevel(); as level) {
                <app-level-badge [level]="level.level" [showName]="true" />
                <span class="max-w-md text-xs text-ink-muted">
                  {{ level.reden }}
                </span>
              } @else {
                <span class="text-xs text-ink-muted">
                  Beantwoord de vragen om een niveau-indicatie te zien.
                </span>
              }
            </div>
            <div class="flex items-center gap-3">
              @if (error(); as message) {
                <span class="text-sm text-alert">{{ message }}</span>
              }
              <button
                type="submit"
                [disabled]="busy()"
                class="rounded border border-kobalt bg-kobalt px-5 py-2 text-sm font-semibold text-white transition-colors hover:border-kobalt-diep hover:bg-kobalt-diep disabled:opacity-60"
              >
                {{
                  busy()
                    ? 'Bezig met opslaan…'
                    : editingId() === 'new'
                      ? 'Toepassing opslaan'
                      : 'Wijzigingen opslaan'
                }}
              </button>
            </div>
          </div>
        </form>
      }
    </div>
  `,
})
export class ApplicationsModule {
  readonly assessmentId = input.required<string>();
  readonly meta = input.required<Meta>();
  readonly initialApplications = input.required<ApplicationDto[]>();
  readonly changed = output<ApplicationDto[]>();

  private readonly api = inject(CadaApi);
  protected readonly metaStore = inject(MetaStore);

  protected readonly inputBase =
    'w-full rounded border border-line-strong bg-wit px-3 py-2 text-sm transition-colors placeholder:text-ink-faint focus:border-kobalt';
  protected readonly criticalInfraOptions = [
    { value: true, label: 'Ja' },
    { value: false, label: 'Nee' },
  ];

  protected readonly applications = signal<ApplicationDto[]>([]);
  protected readonly editingId = signal<string | null>(null); // "new" of app-id
  protected readonly form = signal<FormState>(EMPTY_FORM);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly previewLevel = signal<LevelPreview | null>(null);

  protected readonly formOpen = computed(() => this.editingId() !== null);
  protected readonly supplierOptions = computed(() => [
    ...this.meta().knownSuppliers,
    this.meta().otherSupplier,
  ]);

  private previewTimer: ReturnType<typeof setTimeout> | null = null;
  private previewVersion = 0;

  constructor() {
    effect(() => {
      this.applications.set(this.initialApplications());
    });
    effect(() => {
      const form = this.form();
      const open = this.formOpen();
      untracked(() => this.schedulePreview(form, open));
    });
  }

  protected toggleValue<T>(list: T[], value: T): T[] {
    return toggle(list, value);
  }

  protected patch(changes: Partial<FormState>): void {
    this.form.update((form) => ({ ...form, ...changes }));
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
      aiProcessing: app.aiProcessing,
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

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);

    const form = this.form();
    const payload: ApplicationPayload = {
      name: form.name,
      dataTypes: form.dataTypes,
      regulations: form.regulations,
      impactLevel: form.impactLevel,
      criticalInfra: form.criticalInfra === true,
      aiProcessing: form.aiProcessing === true,
      suppliers: form.suppliers,
      supplierOther: form.supplierOther,
    };

    try {
      const isNew = this.editingId() === 'new';
      const saved = isNew
        ? await this.api.addApplication(this.assessmentId(), payload)
        : await this.api.updateApplication(this.editingId()!, payload);

      this.applications.update((apps) =>
        isNew ? [...apps, saved] : apps.map((a) => (a.id === saved.id ? saved : a)),
      );
      this.changed.emit(this.applications());
      this.closeForm();
    } catch (err) {
      this.error.set(CadaApi.errorMessage(err, 'Opslaan is niet gelukt.'));
    } finally {
      this.busy.set(false);
    }
  }

  protected async remove(app: ApplicationDto): Promise<void> {
    if (!window.confirm(`Weet u zeker dat u de toepassing "${app.name}" wilt verwijderen?`)) {
      return;
    }
    try {
      await this.api.deleteApplication(app.id);
      this.applications.update((apps) => apps.filter((a) => a.id !== app.id));
      this.changed.emit(this.applications());
      if (this.editingId() === app.id) this.closeForm();
    } catch {
      // Verwijderen mislukt (bijv. al verwijderd); lijst ongewijzigd laten.
    }
  }

  /** Debounced niveau-indicatie: de beslisboom draait server-side. */
  private schedulePreview(form: FormState, formOpen: boolean): void {
    if (this.previewTimer !== null) clearTimeout(this.previewTimer);
    const version = ++this.previewVersion;

    if (!formOpen || form.dataTypes.length === 0 || form.impactLevel === null) {
      this.previewLevel.set(null);
      return;
    }

    this.previewTimer = setTimeout(async () => {
      try {
        const preview = await this.api.previewLevel({
          dataTypes: form.dataTypes,
          regulations: form.regulations,
          impactLevel: form.impactLevel,
          criticalInfra: form.criticalInfra === true,
          aiProcessing: form.aiProcessing === true,
        });
        if (version === this.previewVersion) {
          this.previewLevel.set(preview);
        }
      } catch {
        if (version === this.previewVersion) {
          this.previewLevel.set(null);
        }
      }
    }, 250);
  }
}
