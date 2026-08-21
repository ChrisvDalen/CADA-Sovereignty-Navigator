package nl.cada.navigator.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import tools.jackson.databind.JsonNode;

/** Testhulp: doorloopt de magic-link-flow en levert het sessiecookie op. */
final class TestAuth {

    private TestAuth() {
    }

    /** Meldt aan via de magic-link-flow en geeft het cookie-paar ("cada_session=...") terug. */
    static String login(TestRestTemplate rest, String email) {
        ResponseEntity<JsonNode> link = rest.postForEntity(
                "/api/auth/magic-link", Map.of("email", email), JsonNode.class);
        assertThat(link.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);
        String loginUrl = link.getBody().get("loginUrl").asText();
        String token = loginUrl.substring(loginUrl.indexOf("token=") + "token=".length());

        ResponseEntity<JsonNode> session = rest.postForEntity(
                "/api/auth/sessions", Map.of("token", token), JsonNode.class);
        assertThat(session.getStatusCode()).isEqualTo(HttpStatus.OK);
        String setCookie = session.getHeaders().getFirst(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).startsWith("cada_session=");
        return setCookie.split(";", 2)[0];
    }

    static HttpEntity<Void> entity(String cookie) {
        return new HttpEntity<>(headers(cookie));
    }

    static HttpEntity<Object> entity(String cookie, Object body) {
        HttpHeaders headers = headers(cookie);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }

    private static HttpHeaders headers(String cookie) {
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.COOKIE, cookie);
        return headers;
    }
}
