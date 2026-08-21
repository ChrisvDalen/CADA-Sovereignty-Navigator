package nl.cada.navigator.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.TestPropertySource;

import tools.jackson.databind.JsonNode;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestRestTemplate
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:sharetest;DB_CLOSE_DELAY=-1")
class ShareApiTest {

    @Autowired
    private TestRestTemplate rest;

    @Test
    void deellinkGeeftAlleenLezenToegangTotHetRapport() {
        String cookie = TestAuth.login(rest, "delen@gemeente.nl");
        String id = createAssessmentWithApp(cookie, "Gemeente Delen");

        // Nog geen actieve link
        ResponseEntity<JsonNode> status = rest.exchange(
                "/api/assessments/{id}/share", HttpMethod.GET, TestAuth.entity(cookie), JsonNode.class, id);
        assertThat(status.getBody().get("active").asBoolean()).isFalse();

        // Link aanmaken
        ResponseEntity<JsonNode> created = rest.exchange(
                "/api/assessments/{id}/share", HttpMethod.POST, TestAuth.entity(cookie), JsonNode.class, id);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String url = created.getBody().get("url").asText();
        assertThat(url).contains("/delen/");
        String token = url.substring(url.lastIndexOf('/') + 1);

        // Het rapport is zonder aanmelding leesbaar via de deellink
        ResponseEntity<JsonNode> shared = rest.getForEntity("/api/share/{token}", JsonNode.class, token);
        assertThat(shared.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(shared.getBody().get("orgName").asText()).isEqualTo("Gemeente Delen");
        assertThat(shared.getBody().get("report").get("rows")).hasSize(1);

        // Status toont de actieve link; intrekken maakt de deellink ongeldig
        ResponseEntity<JsonNode> activeStatus = rest.exchange(
                "/api/assessments/{id}/share", HttpMethod.GET, TestAuth.entity(cookie), JsonNode.class, id);
        assertThat(activeStatus.getBody().get("active").asBoolean()).isTrue();
        ResponseEntity<JsonNode> revoked = rest.exchange(
                "/api/assessments/{id}/share", HttpMethod.DELETE, TestAuth.entity(cookie), JsonNode.class, id);
        assertThat(revoked.getStatusCode()).isEqualTo(HttpStatus.OK);
        ResponseEntity<JsonNode> afterRevoke = rest.getForEntity("/api/share/{token}", JsonNode.class, token);
        assertThat(afterRevoke.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void dossiersZijnPriveTussenGebruikers() {
        String cookieA = TestAuth.login(rest, "a@gemeente.nl");
        String cookieB = TestAuth.login(rest, "b@gemeente.nl");
        String id = createAssessmentWithApp(cookieA, "Gemeente A");

        // Gebruiker B ziet en bereikt het dossier van A niet
        ResponseEntity<JsonNode> direct = rest.exchange(
                "/api/assessments/{id}", HttpMethod.GET, TestAuth.entity(cookieB), JsonNode.class, id);
        assertThat(direct.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        ResponseEntity<JsonNode> overview = rest.exchange(
                "/api/assessments", HttpMethod.GET, TestAuth.entity(cookieB), JsonNode.class);
        for (JsonNode node : overview.getBody()) {
            assertThat(node.get("id").asText()).isNotEqualTo(id);
        }

        // B kan ook geen deellink voor het dossier van A aanmaken
        ResponseEntity<JsonNode> share = rest.exchange(
                "/api/assessments/{id}/share", HttpMethod.POST, TestAuth.entity(cookieB), JsonNode.class, id);
        assertThat(share.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    private String createAssessmentWithApp(String cookie, String orgName) {
        ResponseEntity<JsonNode> created = rest.exchange(
                "/api/assessments", HttpMethod.POST,
                TestAuth.entity(cookie, Map.of("orgName", orgName)), JsonNode.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String id = created.getBody().get("id").asText();

        ResponseEntity<JsonNode> app = rest.exchange(
                "/api/assessments/{id}/applications", HttpMethod.POST,
                TestAuth.entity(cookie, Map.of(
                        "name", "Zaaksysteem",
                        "dataTypes", List.of("persoonsgegevens"),
                        "regulations", List.of("avg"),
                        "impactLevel", "beperkt",
                        "criticalInfra", false,
                        "suppliers", List.of("SURF"))),
                JsonNode.class, id);
        assertThat(app.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return id;
    }
}
