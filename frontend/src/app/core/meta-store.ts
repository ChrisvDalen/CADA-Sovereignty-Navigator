import { Injectable, inject, signal } from '@angular/core';

import { CadaApi } from './cada-api';
import { CadaLevel, LevelInfo, Meta } from './models';

/** Laadt de referentiedata (vragenlijst-opties, leveranciers, niveaus) eenmalig. */
@Injectable({ providedIn: 'root' })
export class MetaStore {
  private readonly api = inject(CadaApi);
  private readonly _meta = signal<Meta | null>(null);
  private loading: Promise<Meta> | null = null;

  readonly meta = this._meta.asReadonly();

  load(): Promise<Meta> {
    this.loading ??= this.api.getMeta().then((meta) => {
      this._meta.set(meta);
      return meta;
    });
    return this.loading;
  }

  levelInfo(level: CadaLevel): LevelInfo {
    const meta = this._meta();
    return (
      meta?.levelInfo[String(level)] ?? {
        name: '',
        title: `Niveau ${level}`,
        description: '',
        requirements: [],
      }
    );
  }

  impactLabel(key: string): string {
    return this._meta()?.impactLevels.find((i) => i.key === key)?.label ?? key;
  }

  supplierDisplayNames(suppliers: string[], supplierOther: string): string[] {
    const other = this._meta()?.otherSupplier ?? 'Anders';
    return suppliers.map((s) => (s === other && supplierOther ? supplierOther : s));
  }
}
