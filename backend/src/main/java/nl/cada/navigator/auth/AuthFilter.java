package nl.cada.navigator.auth;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import nl.cada.navigator.persistence.UserEntity;

/**
 * Beschermt de API met het sessiecookie. Alleen de aanmeld-endpoints, de
 * alleen-lezen deellinks en de referentiedata zijn zonder sessie bereikbaar.
 */
@Component
public class AuthFilter extends OncePerRequestFilter {

    public static final String USER_ATTRIBUTE = "cada.currentUser";
    public static final String SESSION_COOKIE = "cada_session";

    private static final String[] PUBLIC_PREFIXES = {"/api/auth/", "/api/share/", "/api/meta"};

    private final AuthService authService;

    public AuthFilter(AuthService authService) {
        this.authService = authService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        if (!path.startsWith("/api/")) {
            chain.doFilter(request, response);
            return;
        }

        UserEntity user = authService.resolveSession(sessionToken(request)).orElse(null);
        if (user != null) {
            request.setAttribute(USER_ATTRIBUTE, user);
        }

        if (user == null && !isPublic(path) && !"OPTIONS".equals(request.getMethod())) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"error\":\"Niet aangemeld.\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    public static String sessionToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (SESSION_COOKIE.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private static boolean isPublic(String path) {
        for (String prefix : PUBLIC_PREFIXES) {
            if (path.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }
}
