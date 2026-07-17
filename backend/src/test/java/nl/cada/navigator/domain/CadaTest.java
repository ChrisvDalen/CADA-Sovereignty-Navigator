package nl.cada.navigator.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class CadaTest {

    @Test
    void staatsgeheimenLeidenTotNiveau4() {
        assertThat(Cada.berekenNiveau(List.of("staatsgeheimen"), List.of("geen"), "minimaal", false))
                .isEqualTo(4);
    }

    @Test
    void kritiekeInfraMetKritiekeImpactLeidtTotNiveau4() {
        assertThat(Cada.berekenNiveau(List.of("operationeel"), List.of("geen"), "kritiek", true))
                .isEqualTo(4);
    }

    @Test
    void vertrouwelijkeOverheidsinformatieLeidtTotNiveau3() {
        assertThat(Cada.berekenNiveau(List.of("vertrouwelijk_overheid"), List.of("geen"), "minimaal", false))
                .isEqualTo(3);
    }

    @Test
    void bijzonderePersoonsgegevensMetErnstigeImpactLeidenTotNiveau3() {
        assertThat(Cada.berekenNiveau(List.of("bijzondere_persoonsgegevens"), List.of("avg"), "ernstig", false))
                .isEqualTo(3);
    }

    @Test
    void bijzonderePersoonsgegevensMetBeperkteImpactLeidenTotNiveau1() {
        assertThat(Cada.berekenNiveau(List.of("bijzondere_persoonsgegevens"), List.of("avg"), "beperkt", false))
                .isEqualTo(1);
    }

    @Test
    void persoonsgegevensOnderBioMetErnstigeImpactLeidenTotNiveau2() {
        assertThat(Cada.berekenNiveau(List.of("persoonsgegevens"), List.of("bio"), "ernstig", false))
                .isEqualTo(2);
    }

    @Test
    void persoonsgegevensZonderZwareRegelgevingLeidenTotNiveau1() {
        assertThat(Cada.berekenNiveau(List.of("persoonsgegevens"), List.of("avg"), "ernstig", false))
                .isEqualTo(1);
    }

    @Test
    void operationeleDataLeidtTotNiveau1() {
        assertThat(Cada.berekenNiveau(List.of("operationeel"), List.of("geen"), "minimaal", false))
                .isEqualTo(1);
    }
}
