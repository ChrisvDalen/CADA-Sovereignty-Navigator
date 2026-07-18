package nl.cada.navigator.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import nl.cada.navigator.api.ValidationException;
import nl.cada.navigator.persistence.LoginTokenEntity;
import nl.cada.navigator.persistence.LoginTokenRepository;
import nl.cada.navigator.persistence.UserEntity;
import nl.cada.navigator.persistence.UserRepository;
import nl.cada.navigator.persistence.UserSessionEntity;
import nl.cada.navigator.persistence.UserSessionRepository;

/**
 * Magic-link-authenticatie: een aanmeldlink per e-mailadres, ingewisseld voor
 * een sessiecookie. Tokens worden uitsluitend als SHA-256-hash opgeslagen,
 * zodat een databaselek geen bruikbare links of sessies oplevert.
 */
@Service
@Transactional
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    static final Duration LOGIN_TOKEN_TTL = Duration.ofMinutes(15);
    static final Duration SESSION_TTL = Duration.ofDays(30);

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final UserRepository users;
    private final LoginTokenRepository loginTokens;
    private final UserSessionRepository sessions;
    private final SecureRandom random = new SecureRandom();
    private final boolean exposeLoginLink;
    private final String frontendBaseUrl;

    public AuthService(UserRepository users, LoginTokenRepository loginTokens, UserSessionRepository sessions,
            @Value("${cada.auth.expose-login-link:false}") boolean exposeLoginLink,
            @Value("${cada.auth.frontend-base-url:http://localhost:4200}") String frontendBaseUrl) {
        this.users = users;
        this.loginTokens = loginTokens;
        this.sessions = sessions;
        this.exposeLoginLink = exposeLoginLink;
        this.frontendBaseUrl = frontendBaseUrl.replaceAll("/+$", "");
    }

    /** Resultaat van een magic-link-aanvraag; {@code loginUrl} alleen gevuld als expose aanstaat. */
    public record MagicLinkResult(String email, Optional<String> loginUrl) {
    }

    public record LoginResult(UserEntity user, String sessionToken) {
    }

    public MagicLinkResult requestLoginLink(String rawEmail) {
        String email = rawEmail == null ? "" : rawEmail.trim().toLowerCase(Locale.ROOT);
        if (!EMAIL.matcher(email).matches()) {
            throw new ValidationException("Vul een geldig e-mailadres in.");
        }
        String token = newToken();
        LoginTokenEntity entity = new LoginTokenEntity();
        entity.setTokenHash(hash(token));
        entity.setEmail(email);
        entity.setExpiresAt(Instant.now().plus(LOGIN_TOKEN_TTL));
        loginTokens.save(entity);

        String loginUrl = frontendBaseUrl + "/login/verify?token=" + token;
        // Zonder mailserver is het serverlog het uitleverkanaal van de aanmeldlink.
        log.info("Aanmeldlink voor {}: {}", email, loginUrl);
        return new MagicLinkResult(email, exposeLoginLink ? Optional.of(loginUrl) : Optional.empty());
    }

    public LoginResult redeemLoginToken(String token) {
        LoginTokenEntity entity = loginTokens.findByTokenHash(hash(token == null ? "" : token))
                .orElseThrow(AuthService::invalidLink);
        if (entity.getUsedAt() != null || entity.getExpiresAt().isBefore(Instant.now())) {
            throw invalidLink();
        }
        entity.setUsedAt(Instant.now());

        UserEntity user = users.findByEmail(entity.getEmail()).orElseGet(() -> {
            UserEntity created = new UserEntity();
            created.setEmail(entity.getEmail());
            return users.save(created);
        });
        user.setLastLoginAt(Instant.now());

        String sessionToken = newToken();
        UserSessionEntity session = new UserSessionEntity();
        session.setTokenHash(hash(sessionToken));
        session.setUser(user);
        session.setExpiresAt(Instant.now().plus(SESSION_TTL));
        sessions.save(session);
        return new LoginResult(user, sessionToken);
    }

    public Optional<UserEntity> resolveSession(String sessionToken) {
        if (sessionToken == null || sessionToken.isEmpty()) {
            return Optional.empty();
        }
        return sessions.findByTokenHash(hash(sessionToken))
                .filter(session -> session.getExpiresAt().isAfter(Instant.now()))
                .map(session -> {
                    session.setLastSeenAt(Instant.now());
                    UserEntity user = session.getUser();
                    // Binnen de transactie initialiseren; buiten de filter-transactie
                    // is de lazy proxy anders niet meer te laden.
                    user.getEmail();
                    return user;
                });
    }

    public void endSession(String sessionToken) {
        if (sessionToken == null || sessionToken.isEmpty()) {
            return;
        }
        sessions.findByTokenHash(hash(sessionToken)).ifPresent(sessions::delete);
    }

    public String newToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 niet beschikbaar", e);
        }
    }

    private static ValidationException invalidLink() {
        return new ValidationException("De aanmeldlink is ongeldig of verlopen. Vraag een nieuwe aan.");
    }
}
