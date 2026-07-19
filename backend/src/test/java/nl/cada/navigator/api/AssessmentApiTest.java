package nl.cada.navigator.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.TestPropertySource;

import com.fasterxml.jackson.databind.JsonNode;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:apitest;DB_CLOSE_DELAY=-1")
class AssessmentApiTest {

    @Autowired
    private TestRestTemplate rest;

    private String cookie;

    @BeforeEach
    void aanmelden() {
        cookie = TestAuth.login(rest, "test@gemeente.nl");
    }

    private ResponseEntity<JsonNode> get(String url, Object... vars) {
        return rest.exchange(url, HttpMethod.GET, TestAuth.entity(cookie), JsonNode.class, vars);
    }

    private ResponseEntity<JsonNode> post(String url, Object body, Object... vars) {
        return rest.exchange(url, HttpMethod.POST, TestAuth.entity(cookie, body), JsonNode.class, vars);
    }

    @Test
    void volledigeWizardFlow() {
        // Dossier openen
        ResponseEntity<JsonNode> created = post("/api/assessments", Map.of("orgName", "Gemeente Test"));
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String id = created.getBody().get("id").asText();

        // Toepassing profileren — niveau wordt server-side berekend
        ResponseEntity<JsonNode> app = post(
                "/api/assessments/{id}/applications",
                Map.of(
                        "name", "Zaaksysteem",
                        "dataTypes", List.of("bijzondere_persoonsgegevens"),
                        "regulations", List.of("avg", "bio"),
                        "impactLevel", "ernstig",
                        "criticalInfra", false,
                        "suppliers", List.of("Microsoft Azure")),
                id);
        assertThat(app.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(app.getBody().get("recommendedLevel").asInt()).isEqualTo(3);

        // Niveaubepaling is uitlegbaar
        assertThat(app.getBody().get("levelReason").asText()).contains("bijzondere persoonsgegevens");

        // Rapport bevat compliance-status, aanbevelingen en roadmapfase
        ResponseEntity<JsonNode> report = get("/api/assessments/{id}/report", id);
        assertThat(report.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode row = report.getBody().get("rows").get(0);
        assertThat(row.get("statusLabel").asText()).isEqualTo("GAP");
        assertThat(row.get("compliance").get("achievableLevel").asInt()).isEqualTo(1);
        assertThat(row.get("rank").asInt()).isEqualTo(1);
        assertThat(row.get("phase").asText()).isEqualTo("Middellang (1–2 jaar)");

        // Dashboard-overzicht telt de gap mee
        ResponseEntity<JsonNode> overview = get("/api/assessments");
        assertThat(overview.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode summary = null;
        for (JsonNode node : overview.getBody()) {
            if (node.get("id").asText().equals(id)) summary = node;
        }
        assertThat(summary).isNotNull();
        assertThat(summary.get("applicationCount").asInt()).isEqualTo(1);
        assertThat(summary.get("gapCount").asInt()).isEqualTo(1);
        assertThat(summary.get("maxRecommendedLevel").asInt()).isEqualTo(3);

        // Toepassing verwijderen
        String appId = app.getBody().get("id").asText();
        ResponseEntity<JsonNode> deleted = rest.exchange(
                "/api/applications/{id}", HttpMethod.DELETE, TestAuth.entity(cookie), JsonNode.class, appId);
        assertThat(deleted.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void registerImportSlaatGeldigeRijenOpEnMeldtFouten() {
        ResponseEntity<JsonNode> created = post("/api/assessments", Map.of("orgName", "Import Test"));
        String id = created.getBody().get("id").asText();

        Map<String, Object> geldig = Map.of(
                "name", "Zaaksysteem",
                "dataTypes", List.of("persoonsgegevens"),
                "regulations", List.of("avg"),
                "impactLevel", "ernstig",
                "criticalInfra", false,
                "suppliers", List.of("Microsoft Azure"));
        Map<String, Object> ongeldig = Map.of(
                "name", "",
                "dataTypes", List.of("persoonsgegevens"),
                "regulations", List.of("avg"),
                "impactLevel", "ernstig",
                "suppliers", List.of("Microsoft Azure"));

        ResponseEntity<JsonNode> result = post(
                "/api/assessments/{id}/applications/import",
                Map.of("applications", List.of(geldig, ongeldig)),
                id);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody().get("imported").asInt()).isEqualTo(1);
        assertThat(result.getBody().get("failed").asInt()).isEqualTo(1);
        assertThat(result.getBody().get("errors").get(0).get("row").asInt()).isEqualTo(2);
        // Het niveau wordt server-side berekend, niet uit het bestand overgenomen.
        assertThat(result.getBody().get("applications").get(0).get("recommendedLevel").asInt())
                .isBetween(1, 4);

        // De geïmporteerde toepassing staat in het dossier
        ResponseEntity<JsonNode> assessment = get("/api/assessments/{id}", id);
        assertThat(assessment.getBody().get("applications")).hasSize(1);
    }

    @Test
    void ongeldigePayloadGeeft400MetNederlandseMelding() {
        ResponseEntity<JsonNode> created = post("/api/assessments", Map.of("orgName", "Test"));
        String id = created.getBody().get("id").asText();

        ResponseEntity<JsonNode> response = post(
                "/api/assessments/{id}/applications",
                Map.of("name", "", "dataTypes", List.of(), "regulations", List.of()),
                id);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().get("error").asText()).isEqualTo("Geef de toepassing een naam.");
    }

    @Test
    void onbekendeSessieGeeft404() {
        ResponseEntity<JsonNode> response = get("/api/assessments/{id}", "bestaat-niet");
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void metaLevertReferentiedataUitDeDatabase() {
        ResponseEntity<JsonNode> response = rest.getForEntity("/api/meta", JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("dataTypes")).hasSize(6);
        assertThat(response.getBody().get("knownSuppliers")).hasSize(18);
        assertThat(response.getBody().get("supplierDetails").get(0).get("jurisdiction").asText())
                .isNotEmpty();
        assertThat(response.getBody().get("levelInfo").get("4").get("name").asText())
                .isEqualTo("Soevereiniteit");
    }

    @Test
    void aiVerwerkingVanPersoonsgegevensVerhoogtHetNiveau() {
        ResponseEntity<JsonNode> created = post("/api/assessments", Map.of("orgName", "AI Test"));
        String id = created.getBody().get("id").asText();

        ResponseEntity<JsonNode> app = post(
                "/api/assessments/{id}/applications",
                Map.of(
                        "name", "Chatbot burgerloket",
                        "dataTypes", List.of("persoonsgegevens"),
                        "regulations", List.of("avg"),
                        "impactLevel", "beperkt",
                        "criticalInfra", false,
                        "aiProcessing", true,
                        "suppliers", List.of("OVHcloud")),
                id);

        assertThat(app.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(app.getBody().get("recommendedLevel").asInt()).isEqualTo(2);
        assertThat(app.getBody().get("levelReason").asText()).contains("AI-verwerking");
    }

    @Test
    void leveranciersZijnBeheerbaarViaDeApi() {
        ResponseEntity<JsonNode> created = post(
                "/api/suppliers",
                Map.of(
                        "name", "Testcloud B.V.",
                        "maxLevel", 3,
                        "jurisdiction", "Nederland",
                        "ownership", "Nederlands eigendom",
                        "certifications", "ISO 27001",
                        "notes", "Testleverancier."));
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String supplierId = created.getBody().get("id").asText();

        // Dubbele naam wordt geweigerd
        ResponseEntity<JsonNode> duplicate = post(
                "/api/suppliers", Map.of("name", "Testcloud B.V.", "maxLevel", 2));
        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        // Nieuwe leverancier is direct bruikbaar in een toepassing
        ResponseEntity<JsonNode> assessment = post("/api/assessments", Map.of("orgName", "Beheer Test"));
        ResponseEntity<JsonNode> app = post(
                "/api/assessments/{id}/applications",
                Map.of(
                        "name", "Website",
                        "dataTypes", List.of("operationeel"),
                        "regulations", List.of("geen"),
                        "impactLevel", "minimaal",
                        "criticalInfra", false,
                        "suppliers", List.of("Testcloud B.V.")),
                assessment.getBody().get("id").asText());
        assertThat(app.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // Wijziging is vastgelegd in de audittrail
        ResponseEntity<JsonNode> audit = get("/api/audit/suppliers");
        assertThat(audit.getStatusCode()).isEqualTo(HttpStatus.OK);
        boolean created2 = false;
        for (JsonNode row : audit.getBody()) {
            if (row.get("entityName").asText().equals("Testcloud B.V.")
                    && row.get("action").asText().equals("CREATE")) {
                assertThat(row.get("actor").asText()).isEqualTo("test@gemeente.nl");
                created2 = true;
            }
        }
        assertThat(created2).isTrue();

        // Opruimen
        rest.exchange("/api/suppliers/{id}", HttpMethod.DELETE, TestAuth.entity(cookie), JsonNode.class, supplierId);

        // Het verwijderen staat nu ook in de audittrail
        ResponseEntity<JsonNode> auditNaDelete = get("/api/audit/suppliers");
        boolean deleted = false;
        for (JsonNode row : auditNaDelete.getBody()) {
            if (row.get("entityName").asText().equals("Testcloud B.V.")
                    && row.get("action").asText().equals("DELETE")) {
                deleted = true;
            }
        }
        assertThat(deleted).isTrue();
    }
}
