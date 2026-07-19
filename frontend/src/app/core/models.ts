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

export interface SupplierDetail {
  id: string;
  name: string;
  maxLevel: CadaLevel;
  notes: string;
  jurisdiction: string;
  ownership: string;
  certifications: string;
  lastVerified: string | null;
}

export interface Meta {
  dataTypes: DataType[];
  regulations: Regulation[];
  impactLevels: ImpactLevel[];
  knownSuppliers: string[];
  otherSupplier: string;
  supplierData: Record<string, SupplierInfo>;
  supplierDetails: SupplierDetail[];
  levelInfo: Record<string, LevelInfo>;
}

export interface ApplicationDto {
  id: string;
  name: string;
  dataTypes: string[];
  regulations: string[];
  impactLevel: string;
  criticalInfra: boolean;
  aiProcessing: boolean;
  suppliers: string[];
  supplierOther: string;
  recommendedLevel: CadaLevel;
  levelReason: string;
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
  aiProcessing: boolean;
  suppliers: string[];
  supplierOther: string;
}

export interface LevelPreview {
  level: CadaLevel;
  reden: string;
}

export interface AssessmentSummary {
  id: string;
  orgName: string;
  createdAt: string;
  applicationCount: number;
  gapCount: number;
  maxRecommendedLevel: number;
}

export interface SupplierPayload {
  name: string;
  maxLevel: number;
  notes: string;
  jurisdiction: string;
  ownership: string;
  certifications: string;
  lastVerified: string | null;
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
  phase: string;
}

export interface ReportResponse {
  assessment: AssessmentDto;
  rows: ReportRow[];
}

export interface UserDto {
  email: string;
}

export interface MagicLinkResult {
  email: string;
  /** 'response' = link in dit antwoord (dev); 'log' = link staat in het serverlog. */
  delivered: 'response' | 'log';
  loginUrl: string | null;
}

export interface ShareLinkDto {
  url: string;
  createdAt: string;
}

export interface ShareStatus {
  active: boolean;
  createdAt: string | null;
}

export interface SharedReport {
  orgName: string;
  sharedAt: string;
  report: ReportResponse;
}
