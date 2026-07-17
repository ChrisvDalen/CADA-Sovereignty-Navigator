import type { Application, Assessment } from "@prisma/client";
import {
  parseJsonArray,
  type CadaLevel,
  type DataTypeKey,
  type ImpactKey,
  type RegulationKey,
} from "@/lib/cada";

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

export function toApplicationDto(app: Application): ApplicationDto {
  return {
    id: app.id,
    name: app.name,
    dataTypes: parseJsonArray(app.dataTypes) as DataTypeKey[],
    regulations: parseJsonArray(app.regulations) as RegulationKey[],
    impactLevel: app.impactLevel as ImpactKey,
    criticalInfra: app.criticalInfra,
    suppliers: parseJsonArray(app.suppliers),
    supplierOther: app.supplierOther,
    recommendedLevel: Math.min(4, Math.max(1, app.recommendedLevel)) as CadaLevel,
  };
}

export function toAssessmentDto(
  assessment: Assessment & { applications: Application[] }
): AssessmentDto {
  return {
    id: assessment.id,
    orgName: assessment.orgName,
    createdAt: assessment.createdAt.toISOString(),
    applications: assessment.applications.map(toApplicationDto),
  };
}
