package nl.cada.navigator.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import nl.cada.navigator.domain.ComplianceResult.SupplierCheckResult;

class CadaServiceTest {

    private final CadaService service = new CadaService();

    private static ApplicationInput input(List<String> dataTypes, List<String> regulations,
            String impact, boolean criticalInfra) {
        return new ApplicationInput(dataTypes, regulations, impact, criticalInfra);
    }

    @Nested
    class BerekenNiveau {

        @Test
        void staatsgeheimenGevenNiveau4() {
            int level = service.berekenNiveau(
                    input(List.of("staatsgeheimen"), List.of("geen"), "minimaal", false));
            assertThat(level).isEqualTo(4);
        }

        @Test
        void kritiekeInfraMetKritiekeImpactGeeftNiveau4() {
            int level = service.berekenNiveau(
                    input(List.of("operationeel"), List.of("geen"), "kritiek", true));
            assertThat(level).isEqualTo(4);
        }

        @Test
        void kritiekeInfraMetErnstigeImpactGeeftGeenNiveau4() {
            int level = service.berekenNiveau(
                    input(List.of("operationeel"), List.of("geen"), "ernstig", true));
            assertThat(level).isEqualTo(1);
        }

        @Test
        void vertrouwelijkeOverheidsinformatieGeeftNiveau3() {
            int level = service.berekenNiveau(
                    input(List.of("vertrouwelijk_overheid"), List.of("geen"), "minimaal", false));
            assertThat(level).isEqualTo(3);
        }

        @Test
        void bijzonderePersoonsgegevensMetErnstigeImpactGevenNiveau3() {
            int level = service.berekenNiveau(
                    input(List.of("bijzondere_persoonsgegevens"), List.of("avg"), "ernstig", false));
            assertThat(level).isEqualTo(3);
        }

        @Test
        void bijzonderePersoonsgegevensMetBeperkteImpactGevenNiveau1() {
            int level = service.berekenNiveau(
                    input(List.of("bijzondere_persoonsgegevens"), List.of("avg"), "beperkt", false));
            assertThat(level).isEqualTo(1);
        }

        @Test
        void persoonsgegevensOnderBioMetErnstigeImpactGevenNiveau2() {
            int level = service.berekenNiveau(
                    input(List.of("persoonsgegevens"), List.of("bio"), "ernstig", false));
            assertThat(level).isEqualTo(2);
        }

        @Test
        void persoonsgegevensOnderAvgAlleenGevenNiveau1() {
            int level = service.berekenNiveau(
                    input(List.of("persoonsgegevens"), List.of("avg"), "ernstig", false));
            assertThat(level).isEqualTo(1);
        }

        @Test
        void operationeleDataGeeftNiveau1() {
            int level = service.berekenNiveau(
                    input(List.of("operationeel"), List.of("geen"), "minimaal", false));
            assertThat(level).isEqualTo(1);
        }
    }

    @Nested
    class CheckCompliance {

        @Test
        void zwaksteLeverancierBepaaltHaalbaarNiveau() {
            ComplianceResult result = service.checkCompliance(
                    List.of("Microsoft Azure", "SURF"), 3);

            assertThat(result.achievableLevel()).isEqualTo(1);
            assertThat(result.status()).isEqualTo("gap");
            assertThat(result.gap()).isEqualTo(2);
        }

        @Test
        void compliantLeveranciersGevenStatusOk() {
            ComplianceResult result = service.checkCompliance(List.of("OVHcloud"), 3);

            assertThat(result.status()).isEqualTo("ok");
            assertThat(result.gap()).isZero();
            assertThat(result.suppliers()).extracting(SupplierCheckResult::compliant).containsExactly(true);
        }

        @Test
        void alleenOnbekendeLeveranciersGevenStatusUnknown() {
            ComplianceResult result = service.checkCompliance(List.of("Anders"), 2);

            assertThat(result.status()).isEqualTo("unknown");
            assertThat(result.achievableLevel()).isNull();
            assertThat(result.gap()).isZero();
        }

        @Test
        void bekendeCompliantPlusOnbekendeLeverancierGeeftUnknown() {
            ComplianceResult result = service.checkCompliance(List.of("SURF", "Anders"), 3);

            assertThat(result.status()).isEqualTo("unknown");
            assertThat(result.achievableLevel()).isEqualTo(4);
        }

        @Test
        void gapMetOnbekendeLeverancierBlijftGap() {
            ComplianceResult result = service.checkCompliance(List.of("AWS (Amazon)", "Anders"), 2);

            assertThat(result.status()).isEqualTo("gap");
            assertThat(result.gap()).isEqualTo(1);
        }
    }

    @Nested
    class SuppliersForLevel {

        @Test
        void alleenSurfHaaltNiveau4() {
            assertThat(service.suppliersForLevel(4)).containsExactly("SURF");
        }

        @Test
        void niveau1WordtDoorAlleLeveranciersGehaald() {
            assertThat(service.suppliersForLevel(1))
                    .containsExactlyInAnyOrderElementsOf(CadaDomain.KNOWN_SUPPLIERS);
        }
    }

    @Nested
    class BuildRecommendation {

        @Test
        void okStatusAdviseertVastleggingInRisicodossier() {
            ComplianceResult compliance = service.checkCompliance(List.of("OVHcloud"), 3);
            List<String> adviezen = service.buildRecommendation("Zaaksysteem", 3, compliance);

            assertThat(adviezen).hasSize(1);
            assertThat(adviezen.getFirst()).contains("risicodossier").contains("Zaaksysteem");
        }

        @Test
        void okOpNiveau4AdviseertCertificeringscheck() {
            ComplianceResult compliance = service.checkCompliance(List.of("SURF"), 4);
            List<String> adviezen = service.buildRecommendation("Stg-archief", 4, compliance);

            assertThat(adviezen).hasSize(2);
            assertThat(adviezen.get(1)).contains("EU Sovereign-certificering");
        }

        @Test
        void gapAdviseertMigratieMetKandidaten() {
            ComplianceResult compliance = service.checkCompliance(List.of("Microsoft Azure"), 3);
            List<String> adviezen = service.buildRecommendation("DMS", 3, compliance);

            assertThat(adviezen.getFirst())
                    .contains("Microsoft Azure")
                    .contains("KPN Cloud / Intermax");
            // Niveau >= 3 voegt het strategie-advies toe.
            assertThat(adviezen).anySatisfy(a -> assertThat(a).contains("meerjarige cloudstrategie"));
        }

        @Test
        void gapVanEenNiveauNaarNiveau2NoemtContractstructuur() {
            ComplianceResult compliance = service.checkCompliance(List.of("AWS (Amazon)"), 2);
            List<String> adviezen = service.buildRecommendation("E-maildienst", 2, compliance);

            assertThat(adviezen).anySatisfy(a -> assertThat(a).contains("contractstructuur"));
        }

        @Test
        void unknownStatusAdviseertHandmatigeToets() {
            ComplianceResult compliance = service.checkCompliance(List.of("Anders"), 2);
            List<String> adviezen = service.buildRecommendation("CRM", 2, compliance);

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
