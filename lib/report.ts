import {
  buildRecommendation,
  checkCompliance,
  IMPACT_LEVELS,
  IMPACT_WEIGHT,
  OTHER_SUPPLIER,
  priorityScore,
  type ComplianceResult,
} from "@/lib/cada";
import type { ApplicationDto, AssessmentDto } from "@/lib/types";

export interface ReportRow {
  app: ApplicationDto;
  compliance: ComplianceResult;
  recommendations: string[];
  priority: number;
  impactLabel: string;
  supplierNames: string[];
  statusLabel: "OK" | "GAP" | "ONBEKEND";
}

export function supplierDisplayNames(app: ApplicationDto): string[] {
  return app.suppliers.map((s) =>
    s === OTHER_SUPPLIER && app.supplierOther ? app.supplierOther : s
  );
}

export function buildReportRows(assessment: AssessmentDto): ReportRow[] {
  return assessment.applications.map((app) => {
    const compliance = checkCompliance(app.suppliers, app.recommendedLevel);
    return {
      app,
      compliance,
      recommendations: buildRecommendation(app.name, app.recommendedLevel, compliance),
      priority: priorityScore(app.impactLevel, compliance.gap),
      impactLabel:
        IMPACT_LEVELS.find((i) => i.key === app.impactLevel)?.label ??
        app.impactLevel,
      supplierNames: supplierDisplayNames(app),
      statusLabel:
        compliance.status === "ok"
          ? "OK"
          : compliance.status === "gap"
            ? "GAP"
            : "ONBEKEND",
    };
  });
}

/** Hoogste impact + grootste gap bovenaan. */
export function prioritized(rows: ReportRow[]): ReportRow[] {
  return [...rows].sort(
    (a, b) =>
      b.priority - a.priority ||
      IMPACT_WEIGHT[b.app.impactLevel] - IMPACT_WEIGHT[a.app.impactLevel] ||
      a.app.name.localeCompare(b.app.name, "nl")
  );
}
