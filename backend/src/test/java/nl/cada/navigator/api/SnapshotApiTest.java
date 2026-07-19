package nl.cada.navigator.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

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
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:snapshottest;DB_CLOSE_DELAY=-1")
class SnapshotApiTest {

    @Autowired
    private TestRestTemplate rest;

    @Test
    void momentopnameEnDiffTonenVoortgang() {
        String cookie = TestAuth.login(rest, "snapshot@gemeente.nl");
        ResponseEntity<JsonNode> created = rest.exchange(
                "/api/assessments", HttpMethod.POST,
                TestAuth.entity(cookie, Map.of("orgName", "Gemeente Snapshot")), JsonNode.class);
        String id = created.getBody().get("id").asText();

        addApplication(cookie, id, "Zaaksysteem", List.of("Microsoft Azure"));

        // Momentopname vastleggen met één toepassing
        ResponseEntity<JsonNode> snapshot = rest.exchange(
                "/api/assessments/{id}/snapshots", HttpMethod.POST,
                TestAuth.entity(cookie, Map.of("label", "Q1 2026")), JsonNode.class, id);
        assertThat(snapshot.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(snapshot.getBody().get("label").asText()).isEqualTo("Q1 2026");
        assertThat(snapshot.getBody().get("applicationCount").asInt()).isEqualTo(1);
        String snapshotId = snapshot.getBody().get("id").asText();

        // Later: een tweede toepassing toevoegen
        addApplication(cookie, id, "Datawarehouse", List.of("SURF"));

        // Diff met de huidige stand toont de groei en het gewijzigde leveranciersgebruik
        ResponseEntity<JsonNode> diff = rest.exchange(
                "/api/assessments/{id}/snapshots/diff?from={snap}&to=current", HttpMethod.GET,
                TestAuth.entity(cookie), JsonNode.class, id, snapshotId);
        assertThat(diff.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(diff.getBody().get("fromLabel").asText()).isEqualTo("Q1 2026");
        assertThat(diff.getBody().get("toLabel").asText()).isEqualTo("Huidige stand");
        assertThat(diff.getBody().get("applicationCount").get("from").asInt()).isEqualTo(1);
        assertThat(diff.getBody().get("applicationCount").get("to").asInt()).isEqualTo(2);
        assertThat(diff.getBody().get("applicationCount").get("delta").asInt()).isEqualTo(1);
        assertThat(diff.getBody().get("addedApplications").get(0).asText()).isEqualTo("Datawarehouse");

        boolean surfChanged = false;
        for (JsonNode change : diff.getBody().get("supplierUsage")) {
            if (change.get("key").asText().equals("SURF")) {
                assertThat(change.get("from").asInt()).isEqualTo(0);
                assertThat(change.get("to").asInt()).isEqualTo(1);
                surfChanged = true;
            }
        }
        assertThat(surfChanged).isTrue();

        // Lijst en verwijderen
        ResponseEntity<JsonNode> list = rest.exchange(
                "/api/assessments/{id}/snapshots", HttpMethod.GET, TestAuth.entity(cookie), JsonNode.class, id);
        assertThat(list.getBody()).hasSize(1);
        ResponseEntity<JsonNode> deleted = rest.exchange(
                "/api/assessments/{id}/snapshots/{snap}", HttpMethod.DELETE,
                TestAuth.entity(cookie), JsonNode.class, id, snapshotId);
        assertThat(deleted.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    private void addApplication(String cookie, String id, String name, List<String> suppliers) {
        ResponseEntity<JsonNode> app = rest.exchange(
                "/api/assessments/{id}/applications", HttpMethod.POST,
                TestAuth.entity(cookie, Map.of(
                        "name", name,
                        "dataTypes", List.of("persoonsgegevens"),
                        "regulations", List.of("avg"),
                        "impactLevel", "beperkt",
                        "criticalInfra", false,
                        "suppliers", suppliers)),
                JsonNode.class, id);
        assertThat(app.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }
}
