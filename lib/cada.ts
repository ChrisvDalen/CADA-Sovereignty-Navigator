// Domeinlogica voor de CADA Sovereignty Navigator:
// vragenlijst-opties, beslisboom, niveaubeschrijvingen en prioritering.

export type DataTypeKey =
  | "persoonsgegevens"
  | "bijzondere_persoonsgegevens"
  | "vertrouwelijk_overheid"
  | "staatsgeheimen"
  | "financiele_transacties"
  | "operationeel";

export type RegulationKey = "avg" | "bio" | "nis2" | "bir" | "wbni" | "geen";

export type ImpactKey = "minimaal" | "beperkt" | "ernstig" | "kritiek";

export type CadaLevel = 1 | 2 | 3 | 4;

export const DATA_TYPES: { key: DataTypeKey; label: string; hint: string }[] = [
  {
    key: "persoonsgegevens",
    label: "Persoonsgegevens (AVG)",
    hint: "Namen, adressen, BSN's of andere herleidbare gegevens van burgers of medewerkers.",
  },
  {
    key: "bijzondere_persoonsgegevens",
    label: "Bijzondere persoonsgegevens",
    hint: "Gezondheid, religie, etniciteit, politieke voorkeur of andere gevoelige categorieën.",
  },
  {
    key: "vertrouwelijk_overheid",
    label: "Vertrouwelijke overheidsinformatie",
    hint: "Gerubriceerde informatie (Departementaal Vertrouwelijk of hoger).",
  },
  {
    key: "staatsgeheimen",
    label: "Staatsgeheimen",
    hint: "Informatie gerubriceerd als staatsgeheim (Stg. Confidentieel of hoger).",
  },
  {
    key: "financiele_transacties",
    label: "Financiële transactiedata",
    hint: "Betalingen, subsidies, aanslagen of andere financiële verwerkingen.",
  },
  {
    key: "operationeel",
    label: "Operationele / procesdata (niet-gevoelig)",
    hint: "Logistieke, technische of procesgegevens zonder gevoelige inhoud.",
  },
];

export const REGULATIONS: { key: RegulationKey; label: string }[] = [
  { key: "avg", label: "AVG / GDPR" },
  { key: "bio", label: "BIO (Baseline Informatiebeveiliging Overheid)" },
  { key: "nis2", label: "NIS2" },
  { key: "bir", label: "BIR (Besluit Informatiebeveiliging Rijksdienst)" },
  { key: "wbni", label: "Wbni" },
  { key: "geen", label: "Geen specifieke regelgeving" },
];

export const IMPACT_LEVELS: { key: ImpactKey; label: string; description: string }[] = [
  {
    key: "minimaal",
    label: "Minimaal",
    description: "Geen directe schade bij een datalek of uitval.",
  },
  {
    key: "beperkt",
    label: "Beperkt",
    description: "Schade is intern herstelbaar, zonder externe gevolgen.",
  },
  {
    key: "ernstig",
    label: "Ernstig",
    description: "Reputatieschade of boetes zijn mogelijk.",
  },
  {
    key: "kritiek",
    label: "Kritiek",
    description: "Maatschappelijke ontwrichting of veiligheidsrisico.",
  },
];

export const IMPACT_WEIGHT: Record<ImpactKey, number> = {
  minimaal: 0,
  beperkt: 1,
  ernstig: 2,
  kritiek: 3,
};

export const KNOWN_SUPPLIERS = [
  "AWS (Amazon)",
  "Microsoft Azure",
  "Google Cloud",
  "IBM Cloud",
  "Oracle Cloud",
  "KPN Cloud / Intermax",
  "Cloudferro",
  "SURF",
  "OVHcloud",
] as const;

export const OTHER_SUPPLIER = "Anders";

export interface SupplierInfo {
  maxLevel: CadaLevel;
  notes: string;
}

export const SUPPLIER_DATA: Record<string, SupplierInfo> = {
  "AWS (Amazon)": {
    maxLevel: 1,
    notes:
      "Valt onder de US Cloud Act. Kan niet voldoen aan niveau 2 of hoger vanwege de Amerikaanse moedermaatschappij.",
  },
  "Microsoft Azure": {
    maxLevel: 1,
    notes:
      "Valt onder de US Cloud Act en FISA 702. Europese datacenters voldoen aan niveau 1, maar niet aan niveau 2 of hoger.",
  },
  "Google Cloud": {
    maxLevel: 1,
    notes:
      "Zelfde situatie als AWS en Azure — de Amerikaanse jurisdictie is doorslaggevend.",
  },
  "IBM Cloud": {
    maxLevel: 2,
    notes:
      "Deels onafhankelijke Europese entiteit mogelijk, afhankelijk van de contractstructuur. De moedermaatschappij is gevestigd in de VS.",
  },
  "Oracle Cloud": {
    maxLevel: 1,
    notes:
      "Amerikaanse moedermaatschappij, dezelfde restricties als AWS en Azure.",
  },
  "KPN Cloud / Intermax": {
    maxLevel: 3,
    notes: "Nederlands eigendom, geen niet-EU moedermaatschappij.",
  },
  Cloudferro: {
    maxLevel: 3,
    notes:
      "Europees eigendom, gespecialiseerd in soevereine cloud voor de overheid.",
  },
  SURF: {
    maxLevel: 4,
    notes:
      "Coöperatie van Nederlandse onderwijsinstellingen. Mogelijke niveau 4-kandidaat.",
  },
  OVHcloud: {
    maxLevel: 3,
    notes: "Frans eigendom, Europese entiteit, voldoet aan de niveau 3-criteria.",
  },
};

export const LEVEL_INFO: Record<
  CadaLevel,
  { name: string; title: string; description: string; requirements: string[] }
> = {
  1: {
    name: "Locatie",
    title: "Niveau 1 — Locatie",
    description:
      "De data staat fysiek op Europees grondgebied. Dit is het basisniveau voor al het cloudgebruik door overheidsinstanties.",
    requirements: [
      "Alle data wordt opgeslagen en verwerkt in datacenters binnen de EU/EER.",
      "De aanbieder kan de fysieke locatie van de data contractueel garanderen.",
    ],
  },
  2: {
    name: "Onafhankelijkheid",
    title: "Niveau 2 — Onafhankelijkheid",
    description:
      "De aanbieder is juridisch onafhankelijk van niet-EU-landen en biedt volledige transparantie over de softwarestack.",
    requirements: [
      "Geen juridische verplichtingen richting niet-EU-overheden (zoals de US Cloud Act of FISA 702).",
      "Volledige transparantie over de gebruikte softwarestack en toeleveringsketen.",
      "Alle eisen van niveau 1.",
    ],
  },
  3: {
    name: "EU-controle",
    title: "Niveau 3 — EU-controle",
    description:
      "De aanbieder is Europees eigendom en staat onder Europees bestuur. Zeggenschap ligt volledig binnen de EU.",
    requirements: [
      "Meerderheidsbelang en feitelijke zeggenschap in Europese handen.",
      "Bestuur en toezicht gevestigd binnen de EU.",
      "Alle eisen van niveau 1 en 2.",
    ],
  },
  4: {
    name: "Soevereiniteit",
    title: "Niveau 4 — Soevereiniteit",
    description:
      "Volledige EU Sovereign-certificering via ENISA, met een jaarlijkse onafhankelijke audit. Het hoogste beschermingsniveau, bedoeld voor staatsgeheimen en kritieke infrastructuur.",
    requirements: [
      "Geldige EU Sovereign-certificering, afgegeven via ENISA.",
      "Jaarlijkse onafhankelijke audit op de certificeringseisen.",
      "Alle eisen van niveau 1, 2 en 3.",
    ],
  },
};

export interface ApplicationInput {
  dataTypes: DataTypeKey[];
  regulations: RegulationKey[];
  impactLevel: ImpactKey;
  criticalInfra: boolean;
}

/**
 * Deterministische beslisboom voor het aanbevolen CADA-niveau.
 *
 * 1. Staatsgeheimen, of kritieke infrastructuur met kritieke impact  → niveau 4
 * 2. Vertrouwelijke overheidsinformatie, of bijzondere persoons-
 *    gegevens met ernstige/kritieke impact                           → niveau 3
 * 3. Persoonsgegevens onder BIO/NIS2/BIR met ernstige/kritieke impact → niveau 2
 * 4. Alle overige gevallen                                            → niveau 1
 */
export function berekenNiveau(input: ApplicationInput): CadaLevel {
  const data = new Set(input.dataTypes);
  const regs = new Set(input.regulations);
  const zwareImpact =
    input.impactLevel === "ernstig" || input.impactLevel === "kritiek";

  if (
    data.has("staatsgeheimen") ||
    (input.criticalInfra && input.impactLevel === "kritiek")
  ) {
    return 4;
  }

  if (
    data.has("vertrouwelijk_overheid") ||
    (data.has("bijzondere_persoonsgegevens") && zwareImpact)
  ) {
    return 3;
  }

  if (
    data.has("persoonsgegevens") &&
    (regs.has("bio") || regs.has("nis2") || regs.has("bir")) &&
    zwareImpact
  ) {
    return 2;
  }

  return 1;
}

export interface SupplierCheckResult {
  name: string;
  known: boolean;
  maxLevel: CadaLevel | null;
  notes: string;
  compliant: boolean | null; // null = onbekend (handmatig toetsen)
}

export interface ComplianceResult {
  suppliers: SupplierCheckResult[];
  /** Hoogste niveau dat met de huidige (bekende) leveranciers haalbaar is. */
  achievableLevel: CadaLevel | null;
  /** "ok" | "gap" | "unknown" */
  status: "ok" | "gap" | "unknown";
  /** Grootte van de kloof (aanbevolen − haalbaar), 0 als geen gap. */
  gap: number;
}

export function checkCompliance(
  suppliers: string[],
  recommendedLevel: CadaLevel
): ComplianceResult {
  const results: SupplierCheckResult[] = suppliers.map((name) => {
    const info = SUPPLIER_DATA[name];
    if (!info) {
      return { name, known: false, maxLevel: null, notes: "", compliant: null };
    }
    return {
      name,
      known: true,
      maxLevel: info.maxLevel,
      notes: info.notes,
      compliant: info.maxLevel >= recommendedLevel,
    };
  });

  const known = results.filter((r) => r.known);
  if (known.length === 0) {
    return { suppliers: results, achievableLevel: null, status: "unknown", gap: 0 };
  }

  // Elke leverancier die data van de toepassing verwerkt moet aan het
  // aanbevolen niveau voldoen; het zwakste niveau bepaalt dus de status.
  const weakest = Math.min(...known.map((r) => r.maxLevel as number)) as CadaLevel;
  const gap = Math.max(0, recommendedLevel - weakest);
  const allKnownCompliant = known.every((r) => r.compliant);
  const hasUnknown = results.some((r) => !r.known);

  return {
    suppliers: results,
    achievableLevel: weakest,
    status: gap > 0 ? "gap" : allKnownCompliant && hasUnknown ? "unknown" : "ok",
    gap,
  };
}

/** Leveranciers uit de dataset die minimaal het gevraagde niveau halen. */
export function suppliersForLevel(level: CadaLevel): string[] {
  return Object.entries(SUPPLIER_DATA)
    .filter(([, info]) => info.maxLevel >= level)
    .map(([name]) => name);
}

export function buildRecommendation(
  appName: string,
  recommendedLevel: CadaLevel,
  compliance: ComplianceResult
): string[] {
  const adviezen: string[] = [];

  if (compliance.status === "ok") {
    adviezen.push(
      `De huidige leverancierskeuze is verenigbaar met niveau ${recommendedLevel}. Leg de niveaubepaling en de contractuele garanties vast in het risicodossier van "${appName}".`
    );
    if (recommendedLevel === 4) {
      adviezen.push(
        "Controleer of de leverancier daadwerkelijk over een geldige EU Sovereign-certificering (ENISA) beschikt en plan de jaarlijkse audit in."
      );
    }
    return adviezen;
  }

  if (compliance.status === "unknown") {
    adviezen.push(
      `Eén of meer leveranciers zijn niet in de referentiedataset opgenomen. Toets deze leverancier(s) handmatig aan de criteria van niveau ${recommendedLevel} (jurisdictie, eigendomsstructuur en certificering).`
    );
    return adviezen;
  }

  const kandidaten = suppliersForLevel(recommendedLevel);
  const nietCompliant = compliance.suppliers
    .filter((s) => s.compliant === false)
    .map((s) => s.name);

  if (kandidaten.length > 0) {
    adviezen.push(
      `Overweeg migratie van ${nietCompliant.join(" en ")} naar een leverancier die niveau ${recommendedLevel} haalt, zoals ${kandidaten.join(", ")}.`
    );
  } else {
    adviezen.push(
      `Er is in de referentiedataset geen leverancier die niveau ${recommendedLevel} volledig haalt. Start een marktverkenning naar aanbieders met een EU Sovereign-certificering.`
    );
  }

  if (compliance.gap === 1 && recommendedLevel === 2) {
    adviezen.push(
      "Als alternatief: pas de contractstructuur met de huidige leverancier aan, zodat een juridisch onafhankelijke Europese entiteit de dienst levert. Laat dit juridisch toetsen."
    );
  }

  if (recommendedLevel >= 3) {
    adviezen.push(
      "Neem de migratie op in de meerjarige cloudstrategie en reserveer budget: een overstap op dit niveau raakt doorgaans ook architectuur en beheerprocessen."
    );
  }

  if (recommendedLevel === 4) {
    adviezen.push(
      "Niveau 4 vereist een EU Sovereign-certificering via ENISA met jaarlijkse audit. Verifieer de certificeringsstatus van de beoogde leverancier vóór contractering."
    );
  }

  return adviezen;
}

/**
 * Prioriteitsscore voor de roadmap: hoogste impact + grootste gap bovenaan.
 */
export function priorityScore(impact: ImpactKey, gap: number): number {
  return IMPACT_WEIGHT[impact] * 10 + gap;
}

export function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export const WIZARD_STEPS = [
  { slug: "toepassingen", label: "Toepassingsprofiel" },
  { slug: "leveranciers", label: "Leverancierstoets" },
  { slug: "rapport", label: "Gap-rapport & roadmap" },
  { slug: "export", label: "Exporteren" },
] as const;
