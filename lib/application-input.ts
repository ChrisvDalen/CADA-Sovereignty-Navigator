import {
  berekenNiveau,
  DATA_TYPES,
  IMPACT_LEVELS,
  KNOWN_SUPPLIERS,
  OTHER_SUPPLIER,
  REGULATIONS,
  type DataTypeKey,
  type ImpactKey,
  type RegulationKey,
} from "@/lib/cada";

export interface ParsedApplicationPayload {
  name: string;
  dataTypes: DataTypeKey[];
  regulations: RegulationKey[];
  impactLevel: ImpactKey;
  criticalInfra: boolean;
  suppliers: string[];
  supplierOther: string;
  recommendedLevel: number;
}

const VALID_DATA_TYPES = new Set(DATA_TYPES.map((d) => d.key));
const VALID_REGULATIONS = new Set(REGULATIONS.map((r) => r.key));
const VALID_IMPACT = new Set(IMPACT_LEVELS.map((i) => i.key));
const VALID_SUPPLIERS = new Set<string>([...KNOWN_SUPPLIERS, OTHER_SUPPLIER]);

/**
 * Valideert de payload van het toepassingsformulier en berekent het
 * aanbevolen niveau server-side, zodat de beslisboom niet te omzeilen is.
 */
export function parseApplicationPayload(
  body: unknown
): { ok: true; data: ParsedApplicationPayload } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Ongeldige aanvraag." };
  }
  const b = body as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) return { ok: false, error: "Geef de toepassing een naam." };

  const dataTypes = Array.isArray(b.dataTypes)
    ? (b.dataTypes.filter(
        (d): d is DataTypeKey =>
          typeof d === "string" && VALID_DATA_TYPES.has(d as DataTypeKey)
      ) as DataTypeKey[])
    : [];
  if (dataTypes.length === 0) {
    return { ok: false, error: "Selecteer minimaal één type data." };
  }

  const regulations = Array.isArray(b.regulations)
    ? (b.regulations.filter(
        (r): r is RegulationKey =>
          typeof r === "string" && VALID_REGULATIONS.has(r as RegulationKey)
      ) as RegulationKey[])
    : [];
  if (regulations.length === 0) {
    return {
      ok: false,
      error: "Selecteer de toepasselijke regelgeving (of 'Geen specifieke regelgeving').",
    };
  }

  const impactLevel = b.impactLevel as ImpactKey;
  if (typeof impactLevel !== "string" || !VALID_IMPACT.has(impactLevel)) {
    return { ok: false, error: "Kies de impact bij een datalek of uitval." };
  }

  const criticalInfra = b.criticalInfra === true;

  const suppliers = Array.isArray(b.suppliers)
    ? b.suppliers.filter(
        (s): s is string => typeof s === "string" && VALID_SUPPLIERS.has(s)
      )
    : [];
  if (suppliers.length === 0) {
    return { ok: false, error: "Selecteer minimaal één cloudleverancier." };
  }

  const supplierOther =
    typeof b.supplierOther === "string" ? b.supplierOther.trim() : "";
  if (suppliers.includes(OTHER_SUPPLIER) && !supplierOther) {
    return {
      ok: false,
      error: "Vul de naam van de andere leverancier in.",
    };
  }

  const recommendedLevel = berekenNiveau({
    dataTypes,
    regulations,
    impactLevel,
    criticalInfra,
  });

  return {
    ok: true,
    data: {
      name,
      dataTypes,
      regulations,
      impactLevel,
      criticalInfra,
      suppliers,
      supplierOther: suppliers.includes(OTHER_SUPPLIER) ? supplierOther : "",
      recommendedLevel,
    },
  };
}
