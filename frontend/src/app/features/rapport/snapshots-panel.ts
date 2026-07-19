import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CadaApi } from '../../core/cada-api';
import { SnapshotDiff, SnapshotSummary } from '../../core/models';

/**
 * Momentopnames per kwartaal met een diff-weergave, zodat voortgang zichtbaar
 * wordt ("Azure-toepassingen: 12 → 8 sinds Q1"). Compliance is een
 * momentopname; deze sectie maakt het instrument geschikt voor
 * voortgangsrapportage.
 */
@Component({
  selector: 'app-snapshots-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="rounded-lg border border-line bg-wit p-5">
      <p class="max-w-2xl text-sm leading-relaxed text-ink-muted">
        Leg de huidige stand vast als momentopname (bijvoorbeeld per kwartaal) en vergelijk
        latere metingen ermee. Zo ziet u de voortgang: hoeveel toepassingen zijn verschoven en
        welke leveranciers zijn af- of toegenomen.
      </p>

      @if (error(); as message) {
        <p class="mt-3 rounded border border-alert/30 bg-alert-bg px-3 py-2 text-sm text-alert">
          {{ message }}
        </p>
      }

      <div class="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label class="mb-1 block text-xs font-semibold text-ink">Label (optioneel)</label>
          <input
            [ngModel]="label()"
            (ngModelChange)="label.set($event)"
            placeholder="Bijv. Q3 2026"
            class="rounded border border-line-strong bg-wit px-3 py-2 text-sm placeholder:text-ink-faint focus:border-kobalt"
          />
        </div>
        <button
          type="button"
          (click)="create()"
          [disabled]="busy()"
          class="rounded border border-kobalt bg-kobalt px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-kobalt-diep hover:bg-kobalt-diep disabled:cursor-not-allowed disabled:opacity-60"
        >
          Momentopname vastleggen
        </button>
      </div>

      @if (snapshots().length > 0) {
        <div class="mt-5 overflow-x-auto rounded border border-line">
          <table class="w-full min-w-[520px] text-sm">
            <thead class="bg-porselein text-left">
              <tr>
                <th class="eyebrow px-3 py-2 font-medium">Moment</th>
                <th class="eyebrow px-3 py-2 font-medium">Vastgelegd</th>
                <th class="eyebrow px-3 py-2 font-medium">Toepassingen</th>
                <th class="eyebrow px-3 py-2 font-medium">Gaps</th>
                <th class="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              @for (snapshot of snapshots(); track snapshot.id) {
                <tr>
                  <td class="px-3 py-2 font-semibold text-ink">{{ snapshot.label }}</td>
                  <td class="px-3 py-2 text-ink-muted">
                    {{ snapshot.createdAt | date: 'd MMM y, HH:mm' }}
                  </td>
                  <td class="px-3 py-2 text-ink-muted">{{ snapshot.applicationCount }}</td>
                  <td class="px-3 py-2 text-ink-muted">{{ snapshot.gapCount }}</td>
                  <td class="px-3 py-2 text-right">
                    <button
                      type="button"
                      (click)="compare(snapshot)"
                      class="font-semibold text-kobalt underline-offset-4 hover:underline"
                    >
                      Vergelijk met nu
                    </button>
                    <button
                      type="button"
                      (click)="remove(snapshot)"
                      class="ml-3 text-alert underline-offset-4 hover:underline"
                    >
                      Verwijder
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <p class="mt-4 text-sm text-ink-faint">Nog geen momentopnames vastgelegd.</p>
      }

      @if (diff(); as diff) {
        <div class="mt-6 rounded-lg border border-kobalt/30 bg-kobalt-50/40 p-5">
          <p class="eyebrow">Verschil</p>
          <h3 class="mt-1 font-display text-lg font-semibold text-ink">
            {{ diff.fromLabel }} → {{ diff.toLabel }}
          </h3>

          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <p class="text-sm text-ink">
              Toepassingen:
              <span class="font-semibold">{{ diff.applicationCount.from }}</span>
              → <span class="font-semibold">{{ diff.applicationCount.to }}</span>
              <span [class]="deltaClass(diff.applicationCount.delta)">
                ({{ signed(diff.applicationCount.delta) }})
              </span>
            </p>
            <p class="text-sm text-ink">
              Compliance-gaps:
              <span class="font-semibold">{{ diff.gapCount.from }}</span>
              → <span class="font-semibold">{{ diff.gapCount.to }}</span>
              <span [class]="deltaClass(-diff.gapCount.delta)">
                ({{ signed(diff.gapCount.delta) }})
              </span>
            </p>
          </div>

          @if (changedSuppliers(diff).length > 0) {
            <div class="mt-4">
              <p class="eyebrow mb-1">Leveranciersgebruik</p>
              <ul class="space-y-0.5 text-sm text-ink">
                @for (change of changedSuppliers(diff); track change.key) {
                  <li>
                    {{ change.key }}:
                    <span class="font-mono">{{ change.from }} → {{ change.to }}</span>
                    <span [class]="deltaClass(-change.delta)">({{ signed(change.delta) }})</span>
                  </li>
                }
              </ul>
            </div>
          }

          @if (diff.levelChanges.length > 0) {
            <div class="mt-4">
              <p class="eyebrow mb-1">Niveauverschuivingen</p>
              <ul class="space-y-0.5 text-sm text-ink">
                @for (change of diff.levelChanges; track change.name) {
                  <li>
                    {{ change.name }}: niveau {{ change.fromLevel }} → {{ change.toLevel }}
                  </li>
                }
              </ul>
            </div>
          }

          @if (diff.addedApplications.length > 0 || diff.removedApplications.length > 0) {
            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              @if (diff.addedApplications.length > 0) {
                <p class="text-sm text-ok">
                  <span class="font-semibold">Toegevoegd:</span>
                  {{ diff.addedApplications.join(', ') }}
                </p>
              }
              @if (diff.removedApplications.length > 0) {
                <p class="text-sm text-alert">
                  <span class="font-semibold">Verwijderd:</span>
                  {{ diff.removedApplications.join(', ') }}
                </p>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SnapshotsPanel {
  readonly assessmentId = input.required<string>();

  private readonly api = inject(CadaApi);

  protected readonly snapshots = signal<SnapshotSummary[]>([]);
  protected readonly diff = signal<SnapshotDiff | null>(null);
  protected readonly label = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.assessmentId();
      untracked(() => this.load(id));
    });
  }

  private async load(id: string): Promise<void> {
    try {
      this.snapshots.set(await this.api.listSnapshots(id));
    } catch (err) {
      this.error.set(CadaApi.errorMessage(err, 'Momentopnames konden niet worden geladen.'));
    }
  }

  protected async create(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.api.createSnapshot(this.assessmentId(), this.label().trim());
      this.label.set('');
      await this.load(this.assessmentId());
    } catch (err) {
      this.error.set(CadaApi.errorMessage(err, 'De momentopname kon niet worden vastgelegd.'));
    } finally {
      this.busy.set(false);
    }
  }

  protected async compare(snapshot: SnapshotSummary): Promise<void> {
    this.error.set(null);
    try {
      this.diff.set(await this.api.diffSnapshots(this.assessmentId(), snapshot.id, 'current'));
    } catch (err) {
      this.error.set(CadaApi.errorMessage(err, 'De vergelijking kon niet worden opgehaald.'));
    }
  }

  protected async remove(snapshot: SnapshotSummary): Promise<void> {
    this.error.set(null);
    try {
      await this.api.deleteSnapshot(this.assessmentId(), snapshot.id);
      this.diff.set(null);
      await this.load(this.assessmentId());
    } catch (err) {
      this.error.set(CadaApi.errorMessage(err, 'De momentopname kon niet worden verwijderd.'));
    }
  }

  /** Alleen leveranciers met een daadwerkelijke wijziging tonen. */
  protected changedSuppliers(diff: SnapshotDiff) {
    return diff.supplierUsage.filter((change) => change.delta !== 0);
  }

  protected signed(delta: number): string {
    return delta > 0 ? `+${delta}` : `${delta}`;
  }

  /** Positieve delta groen, negatieve rood (aanroeper draait de betekenis waar nodig om). */
  protected deltaClass(delta: number): string {
    if (delta > 0) return 'text-ok';
    if (delta < 0) return 'text-alert';
    return 'text-ink-faint';
  }
}
