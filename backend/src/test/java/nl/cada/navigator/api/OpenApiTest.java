package nl.cada.navigator.api;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.TestPropertySource;

import com.fasterxml.jackson.databind.JsonNode;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:openapitest;DB_CLOSE_DELAY=-1")
class OpenApiTest {

    @Autowired
    private TestRestTemplate rest;

    @Test
    void openApiSpecificatieIsPubliekBereikbaar() {
        ResponseEntity<JsonNode> response = rest.getForEntity("/v3/api-docs", JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("info").get("title").asText())
                .isEqualTo("CADA Sovereignty Navigator API");
        // De belangrijkste endpoints staan in de gegenereerde specificatie.
        JsonNode paths = response.getBody().get("paths");
        assertThat(paths.has("/api/assessments")).isTrue();
        assertThat(paths.has("/api/auth/magic-link")).isTrue();
    }

    @Test
    void swaggerUiIsBereikbaar() {
        ResponseEntity<String> response = rest.getForEntity("/swagger-ui/index.html", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
