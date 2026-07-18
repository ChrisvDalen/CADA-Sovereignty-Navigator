package nl.cada.navigator.domain;

import java.util.List;

/** Uitkomst van de leverancierstoets voor één toepassing. */
public record ComplianceResult(
        List<SupplierCheckResult> suppliers,
        /* Hoogste niveau dat met de huidige (bekende) leveranciers haalbaar is; null als onbekend. */
        Integer achievableLevel,
        /* "ok" | "gap" | "unknown" */
        String status,
        /* Grootte van de kloof (aanbevolen − haalbaar), 0 als geen gap. */
        int gap) {

    public record SupplierCheckResult(
            String name,
            boolean known,
            Integer maxLevel,
            String notes,
            /* null = onbekend (handmatig toetsen) */
            Boolean compliant) {
    }
}
