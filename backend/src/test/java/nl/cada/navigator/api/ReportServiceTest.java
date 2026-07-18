package nl.cada.navigator.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import nl.cada.navigator.api.dto.ReportResponse;
import nl.cada.navigator.api.dto.ReportResponse.ReportRow;
import nl.cada.navigator.domain.CadaDomain.SupplierInfo;
import nl.cada.navigator.domain.CadaService;
import nl.cada.navigator.domain.SupplierCatalogService;
import nl.cada.navigator.persistence.AssessmentEntity;
import nl.cada.navigator.persistence.CloudApplicationEntity;

class ReportServiceTest {

    private ReportService reportService;

    @BeforeEach
    void setUp() {
        Map<String, SupplierInfo> catalog = new LinkedHashMap<>();
        catalog.put("Microsoft Azure", new SupplierInfo(1, "US Cloud Act."));
        catalog.put("KPN Cloud / Intermax", new SupplierInfo(3, "Nederlands eigendom."));
        catalog.put("SURF", new SupplierInfo(4, "Niveau 4-kandidaat."));

        SupplierCatalogService supplierCatalog = mock(SupplierCatalogService.class);
        when(supplierCatalog.catalog()).thenReturn(catalog);
        reportService = new ReportService(new CadaService(), supplierCatalog);
    }

    private static CloudApplicationEntity app(String name, List<String> dataTypes, String impact,
            List<String> suppliers, String supplierOther, int recommendedLevel) {
        CloudApplicationEntity app = new CloudApplicationEntity();
        app.setName(name);
        app.setDataTypes(dataTypes);
        app.setRegulations(List.of("geen"));
        app.setImpactLevel(impact);
        app.setSuppliers(suppliers);
        app.setSupplierOther(supplierOther);
        app.setRecommendedLevel(recommendedLevel);
        return app;
    }

    private static AssessmentEntity assessment(CloudApplicationEntity... apps) {
        AssessmentEntity assessment = new AssessmentEntity();
        assessment.setOrgName("Gemeente Test");
        for (CloudApplicationEntity app : apps) {
            app.setAssessment(assessment);
            assessment.getApplications().add(app);
        }
        return assessment;
    }

    @Test
    void rijenBlijvenInInvoervolgordeMetPrioriteitsrang() {
        // Laag risico eerst ingevoerd, hoog risico daarna: de rank keert de volgorde om.
        ReportResponse report = reportService.buildReport(assessment(
                app("Website", List.of("operationeel"), "minimaal", List.of("SURF"), "", 1),
                app("Zaaksysteem", List.of("vertrouwelijk_overheid"), "kritiek",
                        List.of("Microsoft Azure"), "", 3)));

        assertThat(report.rows()).extracting(r -> r.app().name())
                .containsExactly("Website", "Zaaksysteem");
        assertThat(report.rows()).extracting(ReportRow::rank).containsExactly(2, 1);
    }

    @Test
    void faseVolgtUitStatusEnDoelniveau() {
        ReportResponse report = reportService.buildReport(assessment(
                app("Op orde", List.of("operationeel"), "minimaal", List.of("SURF"), "", 1),
                app("Onbekend", List.of("operationeel"), "minimaal", List.of("Anders"), "Eigen DC", 1),
                app("Gap n2", List.of("persoonsgegevens"), "ernstig", List.of("Microsoft Azure"), "", 2),
                app("Gap n3", List.of("vertrouwelijk_overheid"), "ernstig", List.of("Microsoft Azure"), "", 3),
                app("Gap n4", List.of("staatsgeheimen"), "kritiek", List.of("Microsoft Azure"), "", 4)));

        assertThat(report.rows()).extracting(ReportRow::phase).containsExactly(
                "Borgen",
                "Handmatig toetsen",
                "Korte termijn (< 1 jaar)",
                "Middellang (1–2 jaar)",
                "Meerjarig (2+ jaar)");
    }

    @Test
    void eigenOpgaveVervangtAndersInDeWeergavenamen() {
        ReportResponse report = reportService.buildReport(assessment(
                app("CRM", List.of("operationeel"), "minimaal", List.of("SURF", "Anders"), "Eigen DC", 1)));

        assertThat(report.rows().getFirst().supplierNames()).containsExactly("SURF", "Eigen DC");
    }

    @Test
    void statusLabelsWordenVertaald() {
        ReportResponse report = reportService.buildReport(assessment(
                app("Ok-app", List.of("operationeel"), "minimaal", List.of("SURF"), "", 1),
                app("Gap-app", List.of("vertrouwelijk_overheid"), "ernstig", List.of("Microsoft Azure"), "", 3),
                app("Onbekend-app", List.of("operationeel"), "minimaal", List.of("Anders"), "X", 1)));

        assertThat(report.rows()).extracting(ReportRow::statusLabel)
                .containsExactly("OK", "GAP", "ONBEKEND");
    }
}
