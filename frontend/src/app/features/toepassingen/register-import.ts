import { ApplicationPayload, Meta } from '../../core/models';

/** Eén ingelezen registerregel, klaar om te importeren of te tonen in de preview. */
export interface MappedRow {
  payload: ApplicationPayload;
  /** Leveranciers uit het bestand die niet in de referentiedataset staan. */
  unknownSuppliers: string[];
}

/** Kolomsynoniemen (NL + EN), zodat een CMDB-export niet exact hoeft te matchen. */
const COLUMN_SYNONYMS: Record<keyof RawColumns, string[]> = {
  name: ['naam', 'toepassing', 'applicatie', 'application', 'app', 'name', 'systeem', 'system'],
  dataTypes: ['datatype', 'datatypes', 'type data', 'data', 'gegevens', 'data types'],
  regulations: ['regelgeving', 'wetgeving', 'regulation', 'regulations', 'compliance'],
  impactLevel: ['impact', 'impactniveau', 'impact level', 'bia', 'classificatie'],
  criticalInfra: ['kritiek', 'kritieke infra', 'kritieke infrastructuur', 'critical', 'critical infra'],
  aiProcessing: ['ai', 'ai-verwerking', 'ai processing', 'ai verwerking', 'kunstmatige intelligentie'],
  suppliers: ['leverancier', 'leveranciers', 'supplier', 'suppliers', 'provider', 'cloud', 'vendor'],
};

interface RawColumns {
  name?: string;
  dataTypes?: string;
  regulations?: string;
  impactLevel?: string;
  criticalInfra?: string;
  aiProcessing?: string;
  suppliers?: string;
}

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

/** Splitst een cel met meerdere waarden (komma, puntkomma, pipe of nieuwe regel). */
function splitCell(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[;,|\n]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return ['ja', 'yes', 'true', 'waar', '1', 'x'].includes(normalise(value));
}

/** Bepaalt per doelveld welke bestandskolom erbij hoort, op basis van de headers. */
export function detectColumns(headers: string[]): RawColumns {
  const mapping: RawColumns = {};
  for (const header of headers) {
    const norm = normalise(header);
    for (const [field, synonyms] of Object.entries(COLUMN_SYNONYMS) as [
      keyof RawColumns,
      string[],
    ][]) {
      if (mapping[field]) continue;
      if (synonyms.some((syn) => norm === syn || norm.includes(syn))) {
        mapping[field] = header;
      }
    }
  }
  return mapping;
}

/** Matcht een vrije tekstwaarde tegen de sleutels/labels van de referentiedata. */
function matchKey(
  value: string,
  options: { key: string; label: string }[],
): string | null {
  const norm = normalise(value);
  const exact = options.find((o) => normalise(o.key) === norm || normalise(o.label) === norm);
  if (exact) return exact.key;
  const partial = options.find(
    (o) => normalise(o.label).includes(norm) || norm.includes(normalise(o.label)),
  );
  return partial ? partial.key : null;
}

/**
 * Zet ingelezen tabelrijen (array van {header: cel}) om naar importpayloads.
 * Datatypes, regelgeving en impact worden gematcht op de referentiedata;
 * onbekende leveranciers belanden onder "Anders" met hun naam als toelichting.
 */
export function mapRows(rows: Record<string, string>[], meta: Meta): MappedRow[] {
  if (rows.length === 0) return [];
  const columns = detectColumns(Object.keys(rows[0]));
  const impactOptions = meta.impactLevels.map((i) => ({ key: i.key, label: i.label }));

  return rows.map((row) => {
    const get = (field: keyof RawColumns): string | undefined =>
      columns[field] ? String(row[columns[field]!] ?? '').trim() : undefined;

    const dataTypes = splitCell(get('dataTypes'))
      .map((v) => matchKey(v, meta.dataTypes))
      .filter((v): v is string => v !== null);

    const regulations = splitCell(get('regulations'))
      .map((v) => matchKey(v, meta.regulations))
      .filter((v): v is string => v !== null);

    const impactRaw = get('impactLevel');
    const impactLevel = impactRaw ? matchKey(impactRaw, impactOptions) : null;

    const knownByNorm = new Map(meta.knownSuppliers.map((s) => [normalise(s), s]));
    const suppliers: string[] = [];
    const unknownSuppliers: string[] = [];
    for (const raw of splitCell(get('suppliers'))) {
      const known = knownByNorm.get(normalise(raw));
      if (known) {
        if (!suppliers.includes(known)) suppliers.push(known);
      } else {
        unknownSuppliers.push(raw);
      }
    }
    if (unknownSuppliers.length > 0 && !suppliers.includes(meta.otherSupplier)) {
      suppliers.push(meta.otherSupplier);
    }

    const payload: ApplicationPayload = {
      name: get('name') ?? '',
      dataTypes,
      regulations,
      impactLevel,
      criticalInfra: parseBoolean(get('criticalInfra')),
      aiProcessing: parseBoolean(get('aiProcessing')),
      suppliers,
      supplierOther: unknownSuppliers.join(', '),
    };
    return { payload, unknownSuppliers };
  });
}

/** Kolomkoppen en één voorbeeldregel voor het downloadbare importsjabloon. */
export function importTemplate(meta: Meta): Record<string, string> {
  const example = meta.dataTypes[0]?.label ?? 'Persoonsgegevens';
  return {
    Toepassing: 'Zaaksysteem',
    'Type data': example,
    Regelgeving: meta.regulations[0]?.label ?? 'AVG / GDPR',
    Impact: meta.impactLevels[2]?.label ?? 'Ernstig',
    'Kritieke infrastructuur': 'Nee',
    'AI-verwerking': 'Nee',
    Leveranciers: meta.knownSuppliers[0] ?? 'Microsoft Azure',
  };
}
