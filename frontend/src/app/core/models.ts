// DTO's zoals geleverd door de Spring Boot-backend (zie nl.cada.navigator.api.dto).

export type CadaLevel = 1 | 2 | 3 | 4;

export interface DataType {
  key: string;
  label: string;
  hint: string;
}

export interface Regulation {
  key: string;
  label: string;
}

export interface ImpactLevel {
  key: string;
  label: string;
  description: string;
  weight: number;
}

export interface SupplierInfo {
  maxLevel: CadaLevel;
  notes: string;
}

export interface LevelInfo {
  name: string;
  title: string;
  description: string;
  requirements: string[];
}

export interface Meta {
  dataTypes: DataType[];
  regulations: Regulation[];
  impactLevels: ImpactLevel[];
  knownSuppliers: string[];
  otherSupplier: string;
  supplierData: Record<string, SupplierInfo>;
  levelInfo: Record<string, LevelInfo>;
}

export interface ApplicationDto {
  id: string;
  name: string;
  dataTypes: string[];
  regulations: string[];
  impactLevel: string;
  criticalInfra: boolean;
  suppliers: string[];
  supplierOther: string;
  recommendedLevel: CadaLevel;
}

export interface AssessmentDto {
  id: string;
  orgName: string;
  createdAt: string;
  applications: ApplicationDto[];
}

export interface ApplicationPayload {
  name: string;
  dataTypes: string[];
  regulations: string[];
  impactLevel: string | null;
  criticalInfra: boolean;
  suppliers: string[];
  supplierOther: string;
}

export interface SupplierCheckResult {
  name: string;
  known: boolean;
  maxLevel: CadaLevel | null;
  notes: string;
  compliant: boolean | null;
}

export interface ComplianceResult {
  suppliers: SupplierCheckResult[];
  achievableLevel: CadaLevel | null;
  status: 'ok' | 'gap' | 'unknown';
  gap: number;
}

export interface ReportRow {
  app: ApplicationDto;
  compliance: ComplianceResult;
  recommendations: string[];
  priority: number;
  impactLabel: string;
  supplierNames: string[];
  statusLabel: 'OK' | 'GAP' | 'ONBEKEND';
  rank: number;
}

export interface ReportResponse {
  assessment: AssessmentDto;
  rows: ReportRow[];
}
