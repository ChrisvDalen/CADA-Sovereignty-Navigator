package nl.cada.navigator.api;

import java.text.Collator;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;

import nl.cada.navigator.api.dto.ApplicationResponse;
import nl.cada.navigator.api.dto.AssessmentResponse;
import nl.cada.navigator.api.dto.ReportResponse;
import nl.cada.navigator.api.dto.ReportResponse.ReportRow;
import nl.cada.navigator.domain.CadaDomain;
import nl.cada.navigator.domain.CadaDomain.SupplierInfo;
import nl.cada.navigator.domain.CadaService;
import nl.cada.navigator.domain.ComplianceResult;
import nl.cada.navigator.domain.SupplierCatalogService;
import nl.cada.navigator.persistence.AssessmentEntity;

/** Bouwt het gap-rapport: samenvattingsrijen met prioriteitsrangorde en roadmapfase. */
@Service
public class ReportService {

    private final CadaService cadaService;
    private final SupplierCatalogService supplierCatalog;

    public ReportService(CadaService cadaService, SupplierCatalogService supplierCatalog) {
        this.cadaService = cadaService;
        this.supplierCatalog = supplierCatalog;
    }

    public ReportResponse buildReport(AssessmentEntity assessment) {
        AssessmentResponse dto = AssessmentResponse.from(assessment);
        Map<String, SupplierInfo> catalog = supplierCatalog.catalog();

        record RowDraft(ApplicationResponse app, ComplianceResult compliance, List<String> recommendations,
                int priority, String impactLabel, List<String> supplierNames, String statusLabel, String phase) {
        }

        List<RowDraft> drafts = dto.applications().stream()
                .map(app -> {
                    ComplianceResult compliance =
                            cadaService.checkCompliance(app.suppliers(), app.recommendedLevel(), catalog);
                    return new RowDraft(
                            app,
                            compliance,
                            cadaService.buildRecommendation(app.name(), app.recommendedLevel(), compliance, catalog),
                            cadaService.priorityScore(app.impactLevel(), compliance.gap()),
                            CadaDomain.impactLabel(app.impactLevel()),
                            supplierDisplayNames(app),
                            switch (compliance.status()) {
                                case "ok" -> "OK";
                                case "gap" -> "GAP";
                                default -> "ONBEKEND";
                            },
                            phase(compliance, app.recommendedLevel()));
                })
                .toList();

        // Hoogste impact + grootste gap bovenaan.
        Collator collator = Collator.getInstance(Locale.of("nl", "NL"));
        Comparator<RowDraft> byPriority = Comparator
                .comparingInt(RowDraft::priority).reversed()
                .thenComparing(Comparator.comparingInt(
                        (RowDraft d) -> CadaDomain.impactWeight(d.app().impactLevel())).reversed())
                .thenComparing(d -> d.app().name(), collator);

        List<RowDraft> prioritized = drafts.stream().sorted(byPriority).toList();

        List<ReportRow> rows = drafts.stream()
                .map(d -> new ReportRow(d.app(), d.compliance(), d.recommendations(), d.priority(),
                        d.impactLabel(), d.supplierNames(), d.statusLabel(),
                        prioritized.indexOf(d) + 1, d.phase()))
                .toList();

        return new ReportResponse(dto, rows);
    }

    /**
     * Roadmapfase: geen gap betekent borgen, een onbekende leverancier vraagt
     * eerst een handmatige toets, en bij een gap bepaalt het doelniveau de
     * doorlooptijd van de migratie.
     */
    private static String phase(ComplianceResult compliance, int recommendedLevel) {
        return switch (compliance.status()) {
            case "ok" -> "Borgen";
            case "unknown" -> "Handmatig toetsen";
            default -> recommendedLevel >= 4
                    ? "Meerjarig (2+ jaar)"
                    : recommendedLevel == 3 ? "Middellang (1–2 jaar)" : "Korte termijn (< 1 jaar)";
        };
    }

    private static List<String> supplierDisplayNames(ApplicationResponse app) {
        List<String> names = new ArrayList<>();
        for (String supplier : app.suppliers()) {
            boolean isOther = CadaDomain.OTHER_SUPPLIER.equals(supplier) && !app.supplierOther().isEmpty();
            names.add(isOther ? app.supplierOther() : supplier);
        }
        return names;
    }
}
