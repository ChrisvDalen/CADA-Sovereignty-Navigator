import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CadaApi } from '../../core/cada-api';
import { CadaLevel, SupplierDetail, SupplierPayload } from '../../core/models';
import { Ladder } from '../../shared/ladder';

interface SupplierForm {
  name: string;
  maxLevel: number;
  notes: string;
  jurisdiction: string;
  ownership: string;
  certifications: string;
}

const EMPTY_FORM: SupplierForm = {
  name: '',
  maxLevel: 1,
  notes: '',
  jurisdiction: '',
  ownership: '',
  certifications: '',
};

/** Beheer van de leveranciersreferentiedata — aanpasbaar zonder redeploy. */
@Component({
  selector: 'app-leveranciers-beheer-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, Ladder],
  template: `
    <div class="flex min-h-screen flex-col">
      <header class="on-dark bg-nacht text-white">
        <div class="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <a routerLink="/" class="font-display text-lg font-bold tracking-tight">
            CADA Sovereignty Navigator
          </a>
          <span class="font-mono text-xs text-kobalt-200">Referentiedata · Leveranciers</span>
        </div>
      </header>

      <main class="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <header class="mb-8 max-w-3xl">
          <p class="eyebrow">Beheer</p>
          <h1 class="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
            Leveranciersreferentiedata
          </h1>
          <p class="mt-3 text-[15px] leading-relaxed text-ink-muted">
            Het maximaal haalbare soevereiniteitsniveau per aanbieder, met de onderbouwing
            (jurisdictie, eigendom en certificeringen). Wijzigingen werken direct door in de
            leverancierstoets van alle dossiers.
          </p>
        </header>

        @if (error(); as message) {
          <p class="mb-4 rounded border border-alert/30 bg-alert-bg px-3 py-2 text-sm text-alert">
            {{ message }}
          </p>
        }

        @if (suppliers(); as suppliers) {
          <div class="overflow-x-auto rounded-lg border border-line bg-wit">
            <table class="w-full min-w-[720px] text-sm">
              <thead>
                <tr class="border-b border-line text-left">
                  <th class="eyebrow px-4 py-3 font-medium">Leverancier</th>
                  <th class="eyebrow px-4 py-3 font-medium">Max. niveau</th>
                  <th class="eyebrow px-4 py-3 font-medium">Jurisdictie</th>
                  <th class="eyebrow hidden px-4 py-3 font-medium lg:table-cell">Certificeringen</th>
                  <th class="eyebrow hidden px-4 py-3 font-medium sm:table-cell">Geverifieerd</th>
                  <th class="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-line">
                @for (supplier of suppliers; track supplier.id) {
                  <tr class="align-top">
                    <td class="px-4 py-3">
                      <span class="font-semibold text-ink">{{ supplier.name }}</span>
                      <span class="mt-0.5 block max-w-md text-xs leading-snug text-ink-muted">
                        {{ supplier.notes }}
                      </span>
                    </td>
                    <td class="px-4 py-3 whitespace-nowrap">
                      <span
                        class="inline-flex items-center gap-1.5 rounded border border-line bg-wit px-2 py-1 font-mono text-xs font-medium text-ink"
                      >
                        <app-ladder [level]="asLevel(supplier.maxLevel)" />
                        N{{ supplier.maxLevel }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-ink-muted">{{ supplier.jurisdiction }}</td>
                    <td class="hidden px-4 py-3 text-ink-muted lg:table-cell">
                      {{ supplier.certifications }}
                    </td>
                    <td class="hidden px-4 py-3 font-mono text-xs text-ink-faint sm:table-cell">
                      {{ supplier.lastVerified ?? '—' }}
                    </td>
                    <td class="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        (click)="openEdit(supplier)"
                        class="text-sm font-medium text-kobalt underline-offset-4 hover:underline"
                      >
                        Bewerken
                      </button>
                      <button
                        type="button"
                        (click)="remove(supplier)"
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
        } @else {
          <p class="text-sm text-ink-muted">Referentiedata wordt geladen…</p>
        }

        @if (!formOpen()) {
          <button
            type="button"
            (click)="openNew()"
            class="mt-6 inline-flex items-center gap-2 rounded border border-kobalt bg-kobalt px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-kobalt-diep hover:bg-kobalt-diep"
          >
            <span aria-hidden="true" class="font-mono">+</span>
            Leverancier toevoegen
          </button>
        } @else {
          <form
            (submit)="save($event)"
            class="mt-6 overflow-hidden rounded-lg border border-line bg-wit"
          >
            <div
              class="flex items-baseline justify-between gap-4 border-b border-line px-5 py-4 sm:px-7"
            >
              <h2 class="font-display text-xl font-semibold tracking-tight text-ink">
                {{ editingId() === 'new' ? 'Nieuwe leverancier' : 'Leverancier bewerken' }}
              </h2>
              <button
                type="button"
                (click)="closeForm()"
                class="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
              >
                Annuleren
              </button>
            </div>

            <div class="grid gap-4 px-5 py-6 sm:grid-cols-2 sm:px-7">
              <div>
                <label for="supplierName" class="mb-1.5 block text-sm font-semibold text-ink">
                  Naam
                </label>
                <input
                  id="supplierName"
                  type="text"
                  name="supplierName"
                  [ngModel]="form().name"
                  (ngModelChange)="patch({ name: $event })"
                  class="{{ inputBase }}"
                />
              </div>
              <div>
                <label for="supplierLevel" class="mb-1.5 block text-sm font-semibold text-ink">
                  Maximaal haalbaar niveau
                </label>
                <select
                  id="supplierLevel"
                  name="supplierLevel"
                  [ngModel]="form().maxLevel"
                  (ngModelChange)="patch({ maxLevel: +$event })"
                  class="{{ inputBase }}"
                >
                  <option [ngValue]="1">Niveau 1 — Locatie</option>
                  <option [ngValue]="2">Niveau 2 — Onafhankelijkheid</option>
                  <option [ngValue]="3">Niveau 3 — EU-controle</option>
                  <option [ngValue]="4">Niveau 4 — Soevereiniteit</option>
                </select>
              </div>
              <div>
                <label for="supplierJurisdiction" class="mb-1.5 block text-sm font-semibold text-ink">
                  Jurisdictie
                </label>
                <input
                  id="supplierJurisdiction"
                  type="text"
                  name="supplierJurisdiction"
                  [ngModel]="form().jurisdiction"
                  (ngModelChange)="patch({ jurisdiction: $event })"
                  placeholder="Bijv. Nederland"
                  class="{{ inputBase }}"
                />
              </div>
              <div>
                <label for="supplierOwnership" class="mb-1.5 block text-sm font-semibold text-ink">
                  Eigendom
                </label>
                <input
                  id="supplierOwnership"
                  type="text"
                  name="supplierOwnership"
                  [ngModel]="form().ownership"
                  (ngModelChange)="patch({ ownership: $event })"
                  placeholder="Bijv. KPN N.V. (NL)"
                  class="{{ inputBase }}"
                />
              </div>
              <div>
                <label
                  for="supplierCertifications"
                  class="mb-1.5 block text-sm font-semibold text-ink"
                >
                  Certificeringen
                </label>
                <input
                  id="supplierCertifications"
                  type="text"
                  name="supplierCertifications"
                  [ngModel]="form().certifications"
                  (ngModelChange)="patch({ certifications: $event })"
                  placeholder="Bijv. ISO 27001, C5"
                  class="{{ inputBase }}"
                />
              </div>
              <div class="sm:col-span-2">
                <label for="supplierNotes" class="mb-1.5 block text-sm font-semibold text-ink">
                  Toelichting
                </label>
                <textarea
                  id="supplierNotes"
                  name="supplierNotes"
                  rows="2"
                  [ngModel]="form().notes"
                  (ngModelChange)="patch({ notes: $event })"
                  class="{{ inputBase }}"
                ></textarea>
              </div>
            </div>

            <div
              class="flex items-center justify-end gap-3 border-t border-line bg-porselein px-5 py-4 sm:px-7"
            >
              <button
                type="submit"
                [disabled]="busy()"
                class="rounded border border-kobalt bg-kobalt px-5 py-2 text-sm font-semibold text-white transition-colors hover:border-kobalt-diep hover:bg-kobalt-diep disabled:opacity-60"
              >
                {{ busy() ? 'Bezig met opslaan…' : 'Opslaan' }}
              </button>
            </div>
          </form>
        }

        <div class="mt-8">
          <a
            routerLink="/"
            class="inline-flex items-center gap-2 rounded border border-line-strong bg-wit px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-kobalt hover:text-kobalt"
          >
            <span aria-hidden="true">←</span>
            Terug naar start
          </a>
        </div>
      </main>
    </div>
  `,
})
export class LeveranciersBeheerPage {
  private readonly api = inject(CadaApi);

  protected readonly inputBase =
    'w-full rounded border border-line-strong bg-wit px-3 py-2 text-sm transition-colors placeholder:text-ink-faint focus:border-kobalt';

  protected readonly suppliers = signal<SupplierDetail[] | null>(null);
  protected readonly editingId = signal<string | null>(null); // "new" of supplier-id
  protected readonly form = signal<SupplierForm>(EMPTY_FORM);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected formOpen(): boolean {
    return this.editingId() !== null;
  }

  constructor() {
    this.reload();
  }

  protected asLevel(level: number): CadaLevel {
    return Math.min(4, Math.max(1, level)) as CadaLevel;
  }

  protected patch(changes: Partial<SupplierForm>): void {
    this.form.update((form) => ({ ...form, ...changes }));
  }

  protected openNew(): void {
    this.form.set(EMPTY_FORM);
    this.editingId.set('new');
    this.error.set(null);
  }

  protected openEdit(supplier: SupplierDetail): void {
    this.form.set({
      name: supplier.name,
      maxLevel: supplier.maxLevel,
      notes: supplier.notes,
      jurisdiction: supplier.jurisdiction,
      ownership: supplier.ownership,
      certifications: supplier.certifications,
    });
    this.editingId.set(supplier.id);
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
    const payload: SupplierPayload = {
      name: form.name,
      maxLevel: form.maxLevel,
      notes: form.notes,
      jurisdiction: form.jurisdiction,
      ownership: form.ownership,
      certifications: form.certifications,
      lastVerified: new Date().toISOString().slice(0, 10),
    };

    try {
      if (this.editingId() === 'new') {
        await this.api.createSupplier(payload);
      } else {
        await this.api.updateSupplier(this.editingId()!, payload);
      }
      this.closeForm();
      await this.reload();
    } catch (err) {
      this.error.set(CadaApi.errorMessage(err, 'Opslaan is niet gelukt.'));
    } finally {
      this.busy.set(false);
    }
  }

  protected async remove(supplier: SupplierDetail): Promise<void> {
    if (!window.confirm(`Weet u zeker dat u "${supplier.name}" wilt verwijderen?`)) {
      return;
    }
    try {
      await this.api.deleteSupplier(supplier.id);
      await this.reload();
    } catch (err) {
      this.error.set(CadaApi.errorMessage(err, 'Verwijderen is niet gelukt.'));
    }
  }

  private async reload(): Promise<void> {
    try {
      this.suppliers.set(await this.api.listSuppliers());
    } catch {
      this.suppliers.set([]);
      this.error.set('De referentiedata kon niet worden geladen.');
    }
  }
}
