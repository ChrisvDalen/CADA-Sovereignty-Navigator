package nl.cada.navigator.auth;

import java.time.Duration;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import nl.cada.navigator.auth.AuthService.LoginResult;
import nl.cada.navigator.auth.AuthService.MagicLinkResult;
import nl.cada.navigator.persistence.UserEntity;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final boolean secureCookies;

    public AuthController(AuthService authService,
            @Value("${cada.auth.secure-cookies:false}") boolean secureCookies) {
        this.authService = authService;
        this.secureCookies = secureCookies;
    }

    public record MagicLinkPayload(String email) {
    }

    public record SessionPayload(String token) {
    }

    public record MagicLinkResponse(String email, String delivered, String loginUrl) {
    }

    public record UserResponse(String email) {
    }

    @PostMapping("/magic-link")
    public ResponseEntity<MagicLinkResponse> requestMagicLink(@RequestBody(required = false) MagicLinkPayload payload) {
        MagicLinkResult result = authService.requestLoginLink(payload == null ? null : payload.email());
        MagicLinkResponse body = result.loginUrl()
                .map(url -> new MagicLinkResponse(result.email(), "response", url))
                .orElseGet(() -> new MagicLinkResponse(result.email(), "log", null));
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(body);
    }

    @PostMapping("/sessions")
    public ResponseEntity<UserResponse> createSession(@RequestBody(required = false) SessionPayload payload) {
        LoginResult result = authService.redeemLoginToken(payload == null ? null : payload.token());
        ResponseCookie cookie = sessionCookie(result.sessionToken(), AuthService.SESSION_TTL);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(new UserResponse(result.user().getEmail()));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        UserEntity user = (UserEntity) request.getAttribute(AuthFilter.USER_ATTRIBUTE);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Niet aangemeld."));
        }
        return ResponseEntity.ok(new UserResponse(user.getEmail()));
    }

    @DeleteMapping("/sessions/current")
    public ResponseEntity<Map<String, Boolean>> logout(HttpServletRequest request) {
        authService.endSession(AuthFilter.sessionToken(request));
        ResponseCookie expired = sessionCookie("", Duration.ZERO);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, expired.toString())
                .body(Map.of("ok", true));
    }

    private ResponseCookie sessionCookie(String value, Duration maxAge) {
        return ResponseCookie.from(AuthFilter.SESSION_COOKIE, value)
                .httpOnly(true)
                .secure(secureCookies)
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAge)
                .build();
    }
}
