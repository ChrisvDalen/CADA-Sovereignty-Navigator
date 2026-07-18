package nl.cada.navigator.api.dto;

import java.util.List;

import nl.cada.navigator.domain.ComplianceResult;

/** Volledig gap-rapport voor een assessment, berekend door de backend. */
public record ReportResponse(AssessmentResponse assessment, List<ReportRow> rows) {

    /**
     * Eén rij per toepassing. {@code rank} is de 1-gebaseerde positie in de
     * prioriteitenmatrix (hoogste impact + grootste gap bovenaan); de rijen
     * zelf staan in invoervolgorde. {@code phase} is de roadmapfase die uit
     * de gap en het aanbevolen niveau volgt.
     */
    public record ReportRow(
            ApplicationResponse app,
            ComplianceResult compliance,
            List<String> recommendations,
            int priority,
            String impactLabel,
            List<String> supplierNames,
            String statusLabel,
            int rank,
            String phase) {
    }
}
