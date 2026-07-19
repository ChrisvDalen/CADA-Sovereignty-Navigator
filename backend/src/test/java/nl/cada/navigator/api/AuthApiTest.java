package nl.cada.navigator.api;

import static org.assertj.core.api.Assertions.assertThat;

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
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:authtest;DB_CLOSE_DELAY=-1")
class AuthApiTest {

    @Autowired
    private TestRestTemplate rest;

    @Test
    void apiVereistAanmelding() {
        ResponseEntity<JsonNode> response = rest.getForEntity("/api/assessments", JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody().get("error").asText()).isEqualTo("Niet aangemeld.");
    }

    @Test
    void referentiedataIsPubliek() {
        ResponseEntity<JsonNode> response = rest.getForEntity("/api/meta", JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void magicLinkFlowMeldtAanEnAf() {
        // Aanmeldlink aanvragen — in dev-modus komt de link in het antwoord mee
        ResponseEntity<JsonNode> link = rest.postForEntity(
                "/api/auth/magic-link", Map.of("email", "Ambtenaar@Gemeente.NL"), JsonNode.class);
        assertThat(link.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);
        assertThat(link.getBody().get("delivered").asText()).isEqualTo("response");
        String loginUrl = link.getBody().get("loginUrl").asText();
        assertThat(loginUrl).contains("/login/verify?token=");
        String token = loginUrl.substring(loginUrl.indexOf("token=") + "token=".length());

        // Token inwisselen voor een sessiecookie; e-mailadres is genormaliseerd
        ResponseEntity<JsonNode> session = rest.postForEntity(
                "/api/auth/sessions", Map.of("token", token), JsonNode.class);
        assertThat(session.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(session.getBody().get("email").asText()).isEqualTo("ambtenaar@gemeente.nl");
        String cookie = session.getHeaders().getFirst("Set-Cookie");
        assertThat(cookie).startsWith("cada_session=").contains("HttpOnly");
        String cookiePair = cookie.split(";", 2)[0];

        // Aangemeld: /me kent de gebruiker en de API is bereikbaar
        ResponseEntity<JsonNode> me = rest.exchange(
                "/api/auth/me", HttpMethod.GET, TestAuth.entity(cookiePair), JsonNode.class);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(me.getBody().get("email").asText()).isEqualTo("ambtenaar@gemeente.nl");

        // Magic-link is eenmalig
        ResponseEntity<JsonNode> reuse = rest.postForEntity(
                "/api/auth/sessions", Map.of("token", token), JsonNode.class);
        assertThat(reuse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        // Afmelden maakt de sessie ongeldig
        ResponseEntity<JsonNode> logout = rest.exchange(
                "/api/auth/sessions/current", HttpMethod.DELETE, TestAuth.entity(cookiePair), JsonNode.class);
        assertThat(logout.getStatusCode()).isEqualTo(HttpStatus.OK);
        ResponseEntity<JsonNode> meNaAfmelden = rest.exchange(
                "/api/auth/me", HttpMethod.GET, TestAuth.entity(cookiePair), JsonNode.class);
        assertThat(meNaAfmelden.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void ongeldigEmailadresWordtGeweigerd() {
        ResponseEntity<JsonNode> response = rest.postForEntity(
                "/api/auth/magic-link", Map.of("email", "geen-adres"), JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().get("error").asText()).isEqualTo("Vul een geldig e-mailadres in.");
    }

    @Test
    void ongeldigTokenWordtGeweigerd() {
        ResponseEntity<JsonNode> response = rest.postForEntity(
                "/api/auth/sessions", Map.of("token", "niet-bestaand"), JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().get("error").asText()).contains("ongeldig of verlopen");
    }
}
