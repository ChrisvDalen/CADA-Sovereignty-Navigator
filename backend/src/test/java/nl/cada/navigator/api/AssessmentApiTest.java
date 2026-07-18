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

        // Rapport bevat compliance-status en aanbevelingen
        ResponseEntity<JsonNode> report = rest.getForEntity(
                "/api/assessments/{id}/report", JsonNode.class, id);
        assertThat(report.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode row = report.getBody().get("rows").get(0);
        assertThat(row.get("statusLabel").asText()).isEqualTo("GAP");
        assertThat(row.get("compliance").get("achievableLevel").asInt()).isEqualTo(1);
        assertThat(row.get("rank").asInt()).isEqualTo(1);

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
    void metaLevertReferentiedata() {
        ResponseEntity<JsonNode> response = rest.getForEntity("/api/meta", JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("dataTypes")).hasSize(6);
        assertThat(response.getBody().get("knownSuppliers")).hasSize(9);
        assertThat(response.getBody().get("levelInfo").get("4").get("name").asText())
                .isEqualTo("Soevereiniteit");
    }
}
