import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { CadaApi } from '../../core/cada-api';
import { ApplicationDto, ImportResult, Meta } from '../../core/models';
import { importTemplate, mapRows, MappedRow } from './register-import';

/**
 * Importeert een applicatieregister (Excel/CSV) en voorziet de vragenlijst van
 * voorinvulling. Het bestand wordt in de browser gelezen (SheetJS, lazy) en per
 * rij gematcht op de referentiedata; de backend berekent daarna per toepassing
 * het niveau en meldt onbruikbare rijen terug.
 */
@Component({
  selector: 'app-import-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-lg border border-line bg-wit">
      <button
        type="button"
        (click)="open.set(!open())"
        class="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span>
          <span class="font-display text-base font-semibold text-ink">
            Register importeren
          </span>
          <span class="mt-0.5 block text-[13px] text-ink-muted">
            Lees een Excel- of CSV-export van uw applicatieregister in en vul de vragenlijst
            automatisch voor.
          </span>
        </span>
        <span class="font-mono text-xs text-kobalt">{{ open() ? '−' : '+' }}</span>
      </button>

      @if (open()) {
        <div class="border-t border-line px-5 py-5">
          <div class="flex flex-wrap items-center gap-3">
            <label
              class="inline-flex cursor-pointer items-center gap-2 rounded border border-kobalt bg-kobalt px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-kobalt-diep hover:bg-kobalt-diep"
            >
              Bestand kiezen
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                class="hidden"
                (change)="onFile($event)"
              />
            </label>
            <button
              type="button"
              (click)="downloadTemplate()"
              class="rounded border border-line-strong px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-kobalt hover:text-kobalt"
            >
              Sjabloon downloaden
            </button>
            @if (fileName(); as name) {
              <span class="font-mono text-xs text-ink-muted">{{ name }}</span>
            }
          </div>

          @if (parseError(); as message) {
            <p class="mt-4 rounded border border-alert/30 bg-alert-bg px-3 py-2 text-sm text-alert">
              {{ message }}
            </p>
          }

          @if (rows().length > 0) {
            <div class="mt-5">
              <p class="text-sm text-ink">
                <span class="font-semibold">{{ rows().length }}</span>
                {{ rows().length === 1 ? 'rij' : 'rijen' }} gelezen.
                @if (readyCount() < rows().length) {
                  <span class="text-warn">
                    {{ rows().length - readyCount() }} rij(en) missen verplichte velden en worden
                    door de server geweigerd.
                  </span>
                }
              </p>

              <div class="mt-3 max-h-72 overflow-auto rounded border border-line">
                <table class="w-full min-w-[640px] text-sm">
                  <thead class="sticky top-0 bg-porselein">
                    <tr class="text-left">
                      <th class="eyebrow px-3 py-2 font-medium">Toepassing</th>
                      <th class="eyebrow px-3 py-2 font-medium">Type data</th>
                      <th class="eyebrow px-3 py-2 font-medium">Impact</th>
                      <th class="eyebrow px-3 py-2 font-medium">Leveranciers</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-line">
                    @for (row of rows(); track $index) {
                      <tr [class]="isReady(row) ? '' : 'bg-warn-bg/40'">
                        <td class="px-3 py-2 font-medium text-ink">
                          {{ row.payload.name || '—' }}
                        </td>
                        <td class="px-3 py-2 text-ink-muted">
                          {{ row.payload.dataTypes.length || '—' }}
                        </td>
                        <td class="px-3 py-2 text-ink-muted">
                          {{ row.payload.impactLevel ? metaLabel(row.payload.impactLevel) : '—' }}
                        </td>
                        <td class="max-w-56 px-3 py-2 text-ink-muted">
                          {{ row.payload.suppliers.join(', ') || '—' }}
                          @if (row.unknownSuppliers.length > 0) {
                            <span class="text-ink-faint">
                              (onbekend → Anders: {{ row.unknownSuppliers.join(', ') }})
                            </span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <div class="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  (click)="doImport()"
                  [disabled]="busy() || readyCount() === 0"
                  class="rounded border border-kobalt bg-kobalt px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-kobalt-diep hover:bg-kobalt-diep disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {{ busy() ? 'Bezig met importeren…' : 'Importeer ' + readyCount() + ' toepassing(en)' }}
                </button>
                <button
                  type="button"
                  (click)="reset()"
                  class="text-sm font-semibold text-ink-muted underline underline-offset-4 hover:text-ink"
                >
                  Wissen
                </button>
              </div>
            </div>
          }

          @if (result(); as result) {
            <div
              class="mt-4 rounded border px-3 py-2 text-sm"
              [class]="
                result.failed === 0
                  ? 'border-ok/30 bg-ok-bg text-ok'
                  : 'border-warn/40 bg-warn-bg text-warn'
              "
            >
              <p class="font-semibold">
                {{ result.imported }} toepassing(en) geïmporteerd.
                @if (result.failed > 0) {
                  {{ result.failed }} overgeslagen.
                }
              </p>
              @if (result.errors.length > 0) {
                <ul class="mt-1 space-y-0.5 text-xs">
                  @for (err of result.errors; track $index) {
                    <li>Rij {{ err.row }} ({{ err.name || 'zonder naam' }}): {{ err.error }}</li>
                  }
                </ul>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ImportPanel {
  readonly assessmentId = input.required<string>();
  readonly meta = input.required<Meta>();
  readonly imported = output<ApplicationDto[]>();

  private readonly api = inject(CadaApi);

  protected readonly open = signal(false);
  protected readonly fileName = signal<string | null>(null);
  protected readonly rows = signal<MappedRow[]>([]);
  protected readonly parseError = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly result = signal<ImportResult | null>(null);

  protected readonly readyCount = computed(
    () => this.rows().filter((row) => this.isReady(row)).length,
  );

  /** Een rij is bruikbaar als naam, minstens één datatype en impact bekend zijn. */
  protected isReady(row: MappedRow): boolean {
    return (
      row.payload.name.trim().length > 0 &&
      row.payload.dataTypes.length > 0 &&
      row.payload.impactLevel !== null &&
      row.payload.suppliers.length > 0
    );
  }

  protected metaLabel(key: string): string {
    return this.meta().impactLevels.find((i) => i.key === key)?.label ?? key;
  }

  protected async onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.fileName.set(file.name);
    this.parseError.set(null);
    this.result.set(null);
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '', raw: false });
      const mapped = mapRows(raw, this.meta());
      if (mapped.length === 0) {
        this.parseError.set('Het bestand bevat geen leesbare rijen.');
      }
      this.rows.set(mapped);
    } catch {
      this.parseError.set('Het bestand kon niet worden gelezen. Gebruik een .xlsx-, .xls- of .csv-bestand.');
      this.rows.set([]);
    } finally {
      // Zelfde bestand opnieuw kunnen kiezen.
      input.value = '';
    }
  }

  protected async doImport(): Promise<void> {
    const ready = this.rows()
      .filter((row) => this.isReady(row))
      .map((row) => row.payload);
    if (ready.length === 0 || this.busy()) return;
    this.busy.set(true);
    try {
      const result = await this.api.importApplications(this.assessmentId(), ready);
      this.result.set(result);
      this.rows.set([]);
      this.fileName.set(null);
      this.imported.emit(result.applications);
    } catch (err) {
      this.parseError.set(CadaApi.errorMessage(err, 'Importeren mislukte. Probeer het opnieuw.'));
    } finally {
      this.busy.set(false);
    }
  }

  protected async downloadTemplate(): Promise<void> {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet([importTemplate(this.meta())]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Register');
    XLSX.writeFile(workbook, 'cada-import-sjabloon.xlsx');
  }

  protected reset(): void {
    this.rows.set([]);
    this.fileName.set(null);
    this.parseError.set(null);
    this.result.set(null);
  }
}
