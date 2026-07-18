package nl.cada.navigator.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
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

    @Test
    void volledigeWizardFlow() {
        // Dossier openen
        ResponseEntity<JsonNode> created = rest.postForEntity(
                "/api/assessments", Map.of("orgName", "Gemeente Test"), JsonNode.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String id = created.getBody().get("id").asText();

        // Toepassing profileren — niveau wordt server-side berekend
        ResponseEntity<JsonNode> app = rest.postForEntity(
                "/api/assessments/{id}/applications",
                Map.of(
                        "name", "Zaaksysteem",
                        "dataTypes", List.of("bijzondere_persoonsgegevens"),
                        "regulations", List.of("avg", "bio"),
                        "impactLevel", "ernstig",
                        "criticalInfra", false,
                        "suppliers", List.of("Microsoft Azure")),
                JsonNode.class, id);
        assertThat(app.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(app.getBody().get("recommendedLevel").asInt()).isEqualTo(3);

        // Niveaubepaling is uitlegbaar
        assertThat(app.getBody().get("levelReason").asText()).contains("bijzondere persoonsgegevens");

        // Rapport bevat compliance-status, aanbevelingen en roadmapfase
        ResponseEntity<JsonNode> report = rest.getForEntity(
                "/api/assessments/{id}/report", JsonNode.class, id);
        assertThat(report.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode row = report.getBody().get("rows").get(0);
        assertThat(row.get("statusLabel").asText()).isEqualTo("GAP");
        assertThat(row.get("compliance").get("achievableLevel").asInt()).isEqualTo(1);
        assertThat(row.get("rank").asInt()).isEqualTo(1);
        assertThat(row.get("phase").asText()).isEqualTo("Middellang (1–2 jaar)");

        // Dashboard-overzicht telt de gap mee
        ResponseEntity<JsonNode> overview = rest.getForEntity("/api/assessments", JsonNode.class);
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
                "/api/applications/{id}", HttpMethod.DELETE, HttpEntity.EMPTY, JsonNode.class, appId);
        assertThat(deleted.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void ongeldigePayloadGeeft400MetNederlandseMelding() {
        ResponseEntity<JsonNode> created = rest.postForEntity(
                "/api/assessments", Map.of("orgName", "Test"), JsonNode.class);
        String id = created.getBody().get("id").asText();

        ResponseEntity<JsonNode> response = rest.postForEntity(
                "/api/assessments/{id}/applications",
                Map.of("name", "", "dataTypes", List.of(), "regulations", List.of()),
                JsonNode.class, id);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().get("error").asText()).isEqualTo("Geef de toepassing een naam.");
    }

    @Test
    void onbekendeSessieGeeft404() {
        ResponseEntity<JsonNode> response = rest.getForEntity(
                "/api/assessments/{id}", JsonNode.class, "bestaat-niet");
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
        ResponseEntity<JsonNode> created = rest.postForEntity(
                "/api/assessments", Map.of("orgName", "AI Test"), JsonNode.class);
        String id = created.getBody().get("id").asText();

        ResponseEntity<JsonNode> app = rest.postForEntity(
                "/api/assessments/{id}/applications",
                Map.of(
                        "name", "Chatbot burgerloket",
                        "dataTypes", List.of("persoonsgegevens"),
                        "regulations", List.of("avg"),
                        "impactLevel", "beperkt",
                        "criticalInfra", false,
                        "aiProcessing", true,
                        "suppliers", List.of("OVHcloud")),
                JsonNode.class, id);

        assertThat(app.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(app.getBody().get("recommendedLevel").asInt()).isEqualTo(2);
        assertThat(app.getBody().get("levelReason").asText()).contains("AI-verwerking");
    }

    @Test
    void leveranciersZijnBeheerbaarViaDeApi() {
        ResponseEntity<JsonNode> created = rest.postForEntity(
                "/api/suppliers",
                Map.of(
                        "name", "Testcloud B.V.",
                        "maxLevel", 3,
                        "jurisdiction", "Nederland",
                        "ownership", "Nederlands eigendom",
                        "certifications", "ISO 27001",
                        "notes", "Testleverancier."),
                JsonNode.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String supplierId = created.getBody().get("id").asText();

        // Dubbele naam wordt geweigerd
        ResponseEntity<JsonNode> duplicate = rest.postForEntity(
                "/api/suppliers", Map.of("name", "Testcloud B.V.", "maxLevel", 2), JsonNode.class);
        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        // Nieuwe leverancier is direct bruikbaar in een toepassing
        ResponseEntity<JsonNode> assessment = rest.postForEntity(
                "/api/assessments", Map.of("orgName", "Beheer Test"), JsonNode.class);
        ResponseEntity<JsonNode> app = rest.postForEntity(
                "/api/assessments/{id}/applications",
                Map.of(
                        "name", "Website",
                        "dataTypes", List.of("operationeel"),
                        "regulations", List.of("geen"),
                        "impactLevel", "minimaal",
                        "criticalInfra", false,
                        "suppliers", List.of("Testcloud B.V.")),
                JsonNode.class, assessment.getBody().get("id").asText());
        assertThat(app.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // Opruimen
        rest.exchange("/api/suppliers/{id}", HttpMethod.DELETE, HttpEntity.EMPTY, JsonNode.class, supplierId);
    }
}
