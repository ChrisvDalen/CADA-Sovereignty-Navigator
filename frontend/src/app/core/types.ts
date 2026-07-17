import type {
  CadaLevel,
  DataTypeKey,
  ImpactKey,
  RegulationKey,
} from './cada';

export interface ApplicationDto {
  id: string;
  name: string;
  dataTypes: DataTypeKey[];
  regulations: RegulationKey[];
  impactLevel: ImpactKey;
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
  dataTypes: DataTypeKey[];
  regulations: RegulationKey[];
  impactLevel: ImpactKey | null;
  criticalInfra: boolean;
  suppliers: string[];
  supplierOther: string;
}
