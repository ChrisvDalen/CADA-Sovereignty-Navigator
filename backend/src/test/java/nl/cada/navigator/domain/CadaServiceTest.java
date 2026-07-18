package nl.cada.navigator.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import nl.cada.navigator.domain.CadaDomain.SupplierInfo;
import nl.cada.navigator.domain.ComplianceResult.SupplierCheckResult;

class CadaServiceTest {

    private final CadaService service = new CadaService();

    /** Compacte catalogus met dezelfde kernleveranciers als de seed-data. */
    private static final Map<String, SupplierInfo> CATALOG = new LinkedHashMap<>();

    static {
        CATALOG.put("AWS (Amazon)", new SupplierInfo(1, "US Cloud Act."));
        CATALOG.put("Microsoft Azure", new SupplierInfo(1, "US Cloud Act en FISA 702."));
        CATALOG.put("IBM Cloud", new SupplierInfo(2, "Deels Europese entiteit."));
        CATALOG.put("KPN Cloud / Intermax", new SupplierInfo(3, "Nederlands eigendom."));
        CATALOG.put("OVHcloud", new SupplierInfo(3, "Frans eigendom."));
        CATALOG.put("SURF", new SupplierInfo(4, "Niveau 4-kandidaat."));
    }

    private static ApplicationInput input(List<String> dataTypes, List<String> regulations,
            String impact, boolean criticalInfra) {
        return new ApplicationInput(dataTypes, regulations, impact, criticalInfra, false);
    }

    private static ApplicationInput aiInput(List<String> dataTypes, List<String> regulations,
            String impact) {
        return new ApplicationInput(dataTypes, regulations, impact, false, true);
    }

    @Nested
    class BerekenNiveau {

        @Test
        void staatsgeheimenGevenNiveau4MetReden() {
            NiveauBesluit besluit = service.berekenNiveau(
                    input(List.of("staatsgeheimen"), List.of("geen"), "minimaal", false));
            assertThat(besluit.level()).isEqualTo(4);
            assertThat(besluit.reden()).contains("staatsgeheimen");
        }

        @Test
        void kritiekeInfraMetKritiekeImpactGeeftNiveau4() {
            NiveauBesluit besluit = service.berekenNiveau(
                    input(List.of("operationeel"), List.of("geen"), "kritiek", true));
            assertThat(besluit.level()).isEqualTo(4);
            assertThat(besluit.reden()).contains("kritieke infrastructuur");
        }

        @Test
        void kritiekeInfraMetErnstigeImpactGeeftGeenNiveau4() {
            assertThat(service.berekenNiveau(
                    input(List.of("operationeel"), List.of("geen"), "ernstig", true)).level())
                    .isEqualTo(1);
        }

        @Test
        void vertrouwelijkeOverheidsinformatieGeeftNiveau3() {
            NiveauBesluit besluit = service.berekenNiveau(
                    input(List.of("vertrouwelijk_overheid"), List.of("geen"), "minimaal", false));
            assertThat(besluit.level()).isEqualTo(3);
            assertThat(besluit.reden()).contains("vertrouwelijke overheidsinformatie");
        }

        @Test
        void bijzonderePersoonsgegevensMetErnstigeImpactGevenNiveau3() {
            assertThat(service.berekenNiveau(
                    input(List.of("bijzondere_persoonsgegevens"), List.of("avg"), "ernstig", false)).level())
                    .isEqualTo(3);
        }

        @Test
        void bijzonderePersoonsgegevensMetBeperkteImpactGevenNiveau1() {
            assertThat(service.berekenNiveau(
                    input(List.of("bijzondere_persoonsgegevens"), List.of("avg"), "beperkt", false)).level())
                    .isEqualTo(1);
        }

        @Test
        void persoonsgegevensOnderBioMetErnstigeImpactGevenNiveau2() {
            assertThat(service.berekenNiveau(
                    input(List.of("persoonsgegevens"), List.of("bio"), "ernstig", false)).level())
                    .isEqualTo(2);
        }

        @Test
        void persoonsgegevensOnderAvgAlleenGevenNiveau1() {
            assertThat(service.berekenNiveau(
                    input(List.of("persoonsgegevens"), List.of("avg"), "ernstig", false)).level())
                    .isEqualTo(1);
        }

        @Test
        void operationeleDataGeeftNiveau1MetBasisReden() {
            NiveauBesluit besluit = service.berekenNiveau(
                    input(List.of("operationeel"), List.of("geen"), "minimaal", false));
            assertThat(besluit.level()).isEqualTo(1);
            assertThat(besluit.reden()).contains("basisniveau");
        }

        @Test
        void aiVerwerkingVanBijzonderePersoonsgegevensGeeftNiveau3OokBijLageImpact() {
            NiveauBesluit besluit = service.berekenNiveau(
                    aiInput(List.of("bijzondere_persoonsgegevens"), List.of("avg"), "beperkt"));
            assertThat(besluit.level()).isEqualTo(3);
            assertThat(besluit.reden()).contains("AI-verwerking");
        }

        @Test
        void aiVerwerkingVanPersoonsgegevensGeeftMinimaalNiveau2() {
            NiveauBesluit besluit = service.berekenNiveau(
                    aiInput(List.of("persoonsgegevens"), List.of("avg"), "minimaal"));
            assertThat(besluit.level()).isEqualTo(2);
            assertThat(besluit.reden()).contains("AI-verwerking");
        }

        @Test
        void aiVerwerkingZonderPersoonsgegevensBlijftNiveau1() {
            assertThat(service.berekenNiveau(
                    aiInput(List.of("operationeel"), List.of("geen"), "minimaal")).level())
                    .isEqualTo(1);
        }

        @Test
        void zwaardereRegelGaatVoorAiRegel() {
            // Staatsgeheimen winnen van de AI-regel.
            NiveauBesluit besluit = service.berekenNiveau(new ApplicationInput(
                    List.of("staatsgeheimen", "persoonsgegevens"), List.of("geen"), "minimaal", false, true));
            assertThat(besluit.level()).isEqualTo(4);
            assertThat(besluit.reden()).contains("staatsgeheimen");
        }
    }

    @Nested
    class CheckCompliance {

        @Test
        void zwaksteLeverancierBepaaltHaalbaarNiveau() {
            ComplianceResult result = service.checkCompliance(
                    List.of("Microsoft Azure", "SURF"), 3, CATALOG);

            assertThat(result.achievableLevel()).isEqualTo(1);
            assertThat(result.status()).isEqualTo("gap");
            assertThat(result.gap()).isEqualTo(2);
        }

        @Test
        void compliantLeveranciersGevenStatusOk() {
            ComplianceResult result = service.checkCompliance(List.of("OVHcloud"), 3, CATALOG);

            assertThat(result.status()).isEqualTo("ok");
            assertThat(result.gap()).isZero();
            assertThat(result.suppliers()).extracting(SupplierCheckResult::compliant).containsExactly(true);
        }

        @Test
        void alleenOnbekendeLeveranciersGevenStatusUnknown() {
            ComplianceResult result = service.checkCompliance(List.of("Anders"), 2, CATALOG);

            assertThat(result.status()).isEqualTo("unknown");
            assertThat(result.achievableLevel()).isNull();
            assertThat(result.gap()).isZero();
        }

        @Test
        void bekendeCompliantPlusOnbekendeLeverancierGeeftUnknown() {
            ComplianceResult result = service.checkCompliance(List.of("SURF", "Anders"), 3, CATALOG);

            assertThat(result.status()).isEqualTo("unknown");
            assertThat(result.achievableLevel()).isEqualTo(4);
        }

        @Test
        void gapMetOnbekendeLeverancierBlijftGap() {
            ComplianceResult result = service.checkCompliance(List.of("AWS (Amazon)", "Anders"), 2, CATALOG);

            assertThat(result.status()).isEqualTo("gap");
            assertThat(result.gap()).isEqualTo(1);
        }
    }

    @Nested
    class SuppliersForLevel {

        @Test
        void alleenSurfHaaltNiveau4() {
            assertThat(service.suppliersForLevel(4, CATALOG)).containsExactly("SURF");
        }

        @Test
        void niveau1WordtDoorAlleLeveranciersGehaald() {
            assertThat(service.suppliersForLevel(1, CATALOG))
                    .containsExactlyInAnyOrderElementsOf(CATALOG.keySet());
        }
    }

    @Nested
    class BuildRecommendation {

        @Test
        void okStatusAdviseertVastleggingInRisicodossier() {
            ComplianceResult compliance = service.checkCompliance(List.of("OVHcloud"), 3, CATALOG);
            List<String> adviezen = service.buildRecommendation("Zaaksysteem", 3, compliance, CATALOG);

            assertThat(adviezen).hasSize(1);
            assertThat(adviezen.getFirst()).contains("risicodossier").contains("Zaaksysteem");
        }

        @Test
        void okOpNiveau4AdviseertCertificeringscheck() {
            ComplianceResult compliance = service.checkCompliance(List.of("SURF"), 4, CATALOG);
            List<String> adviezen = service.buildRecommendation("Stg-archief", 4, compliance, CATALOG);

            assertThat(adviezen).hasSize(2);
            assertThat(adviezen.get(1)).contains("EU Sovereign-certificering");
        }

        @Test
        void gapAdviseertMigratieMetKandidaten() {
            ComplianceResult compliance = service.checkCompliance(List.of("Microsoft Azure"), 3, CATALOG);
            List<String> adviezen = service.buildRecommendation("DMS", 3, compliance, CATALOG);

            assertThat(adviezen.getFirst())
                    .contains("Microsoft Azure")
                    .contains("KPN Cloud / Intermax");
            // Niveau >= 3 voegt het strategie-advies toe.
            assertThat(adviezen).anySatisfy(a -> assertThat(a).contains("meerjarige cloudstrategie"));
        }

        @Test
        void gapVanEenNiveauNaarNiveau2NoemtContractstructuur() {
            ComplianceResult compliance = service.checkCompliance(List.of("AWS (Amazon)"), 2, CATALOG);
            List<String> adviezen = service.buildRecommendation("E-maildienst", 2, compliance, CATALOG);

            assertThat(adviezen).anySatisfy(a -> assertThat(a).contains("contractstructuur"));
        }

        @Test
        void unknownStatusAdviseertHandmatigeToets() {
            ComplianceResult compliance = service.checkCompliance(List.of("Anders"), 2, CATALOG);
            List<String> adviezen = service.buildRecommendation("CRM", 2, compliance, CATALOG);

            assertThat(adviezen).hasSize(1);
            assertThat(adviezen.getFirst()).contains("handmatig");
        }
    }

    @Nested
    class PriorityScore {

        @Test
        void impactWeegtZwaarderDanGap() {
            int kritiekZonderGap = service.priorityScore("kritiek", 0);
            int minimaalMetMaximaleGap = service.priorityScore("minimaal", 3);

            assertThat(kritiekZonderGap).isGreaterThan(minimaalMetMaximaleGap);
        }

        @Test
        void gapBreektGelijkspelBinnenZelfdeImpact() {
            assertThat(service.priorityScore("ernstig", 2))
                    .isGreaterThan(service.priorityScore("ernstig", 1));
        }
    }
}
