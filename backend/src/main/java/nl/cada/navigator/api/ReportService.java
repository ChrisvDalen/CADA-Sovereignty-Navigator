package nl.cada.navigator.api;

import java.text.Collator;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;

import nl.cada.navigator.api.dto.ApplicationResponse;
import nl.cada.navigator.api.dto.AssessmentResponse;
import nl.cada.navigator.api.dto.ReportResponse;
import nl.cada.navigator.api.dto.ReportResponse.ReportRow;
import nl.cada.navigator.domain.CadaDomain;
import nl.cada.navigator.domain.CadaService;
import nl.cada.navigator.domain.ComplianceResult;
import nl.cada.navigator.persistence.AssessmentEntity;

/** Bouwt het gap-rapport: samenvattingsrijen met prioriteitsrangorde. */
@Service
public class ReportService {

    private final CadaService cadaService;

    public ReportService(CadaService cadaService) {
        this.cadaService = cadaService;
    }

    public ReportResponse buildReport(AssessmentEntity assessment) {
        AssessmentResponse dto = AssessmentResponse.from(assessment);

        record RowDraft(ApplicationResponse app, ComplianceResult compliance, List<String> recommendations,
                int priority, String impactLabel, List<String> supplierNames, String statusLabel) {
        }

        List<RowDraft> drafts = dto.applications().stream()
                .map(app -> {
                    ComplianceResult compliance = cadaService.checkCompliance(app.suppliers(), app.recommendedLevel());
                    return new RowDraft(
                            app,
                            compliance,
                            cadaService.buildRecommendation(app.name(), app.recommendedLevel(), compliance),
                            cadaService.priorityScore(app.impactLevel(), compliance.gap()),
                            CadaDomain.impactLabel(app.impactLevel()),
                            supplierDisplayNames(app),
                            switch (compliance.status()) {
                                case "ok" -> "OK";
                                case "gap" -> "GAP";
                                default -> "ONBEKEND";
                            });
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
                        prioritized.indexOf(d) + 1))
                .toList();

        return new ReportResponse(dto, rows);
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
