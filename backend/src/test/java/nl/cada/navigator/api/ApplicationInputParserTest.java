package nl.cada.navigator.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import nl.cada.navigator.api.ApplicationInputParser.ParsedApplication;
import nl.cada.navigator.api.dto.ApplicationPayload;
import nl.cada.navigator.domain.CadaDomain.SupplierInfo;
import nl.cada.navigator.domain.CadaService;
import nl.cada.navigator.domain.SupplierCatalogService;

class ApplicationInputParserTest {

    private ApplicationInputParser parser;

    @BeforeEach
    void setUp() {
        Map<String, SupplierInfo> catalog = new LinkedHashMap<>();
        catalog.put("SURF", new SupplierInfo(4, "Niveau 4-kandidaat."));
        SupplierCatalogService supplierCatalog = mock(SupplierCatalogService.class);
        when(supplierCatalog.catalog()).thenReturn(catalog);
        parser = new ApplicationInputParser(new CadaService(), supplierCatalog);
    }

    private static ApplicationPayload payload(String name, List<String> dataTypes, List<String> regulations,
            String impact, Boolean ai, List<String> suppliers, String supplierOther) {
        return new ApplicationPayload(name, dataTypes, regulations, impact, false, ai, suppliers, supplierOther);
    }

    @Test
    void berekentNiveauEnMotiveringServerSide() {
        ParsedApplication parsed = parser.parse(payload("Chatbot", List.of("persoonsgegevens"),
                List.of("avg"), "beperkt", true, List.of("SURF"), ""));

        assertThat(parsed.recommendedLevel()).isEqualTo(2);
        assertThat(parsed.levelReason()).contains("AI-verwerking");
    }

    @Test
    void onbekendeSleutelsWordenGefilterd() {
        ParsedApplication parsed = parser.parse(payload("App",
                List.of("persoonsgegevens", "niet-bestaand"), List.of("avg", "xyz"),
                "minimaal", false, List.of("SURF", "Niet in catalogus"), ""));

        assertThat(parsed.dataTypes()).containsExactly("persoonsgegevens");
        assertThat(parsed.regulations()).containsExactly("avg");
        assertThat(parsed.suppliers()).containsExactly("SURF");
    }

    @Test
    void legeNaamGeeftNederlandseFoutmelding() {
        assertThatThrownBy(() -> parser.parse(payload("  ", List.of("operationeel"),
                List.of("geen"), "minimaal", false, List.of("SURF"), "")))
                .isInstanceOf(ValidationException.class)
                .hasMessage("Geef de toepassing een naam.");
    }

    @Test
    void andersZonderEigenOpgaveWordtGeweigerd() {
        assertThatThrownBy(() -> parser.parse(payload("App", List.of("operationeel"),
                List.of("geen"), "minimaal", false, List.of("Anders"), "  ")))
                .isInstanceOf(ValidationException.class)
                .hasMessage("Vul de naam van de andere leverancier in.");
    }

    @Test
    void eigenOpgaveWordtGewistZonderAnders() {
        ParsedApplication parsed = parser.parse(payload("App", List.of("operationeel"),
                List.of("geen"), "minimaal", false, List.of("SURF"), "Restje"));

        assertThat(parsed.supplierOther()).isEmpty();
    }

    @Test
    void ongeldigeImpactWordtGeweigerd() {
        assertThatThrownBy(() -> parser.parse(payload("App", List.of("operationeel"),
                List.of("geen"), "rampzalig", false, List.of("SURF"), "")))
                .isInstanceOf(ValidationException.class)
                .hasMessage("Kies de impact bij een datalek of uitval.");
    }
}
