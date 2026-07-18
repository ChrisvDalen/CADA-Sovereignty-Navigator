package nl.cada.navigator.api;

import java.time.Instant;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import nl.cada.navigator.api.dto.ReportResponse;
import nl.cada.navigator.auth.AuthService;
import nl.cada.navigator.persistence.AssessmentEntity;
import nl.cada.navigator.persistence.AssessmentRepository;
import nl.cada.navigator.persistence.ShareLinkEntity;
import nl.cada.navigator.persistence.ShareLinkRepository;
import nl.cada.navigator.persistence.UserEntity;

/**
 * Alleen-lezen deellinks: de eigenaar maakt per dossier één actieve link aan
 * waarmee bijvoorbeeld het bestuur het rapport kan inzien zonder aanmelding.
 */
@RestController
public class ShareController {

    private final AssessmentRepository assessments;
    private final ShareLinkRepository shareLinks;
    private final ReportService reportService;
    private final AuthService authService;
    private final String frontendBaseUrl;

    public ShareController(AssessmentRepository assessments, ShareLinkRepository shareLinks,
            ReportService reportService, AuthService authService,
            @Value("${cada.auth.frontend-base-url:http://localhost:4200}") String frontendBaseUrl) {
        this.assessments = assessments;
        this.shareLinks = shareLinks;
        this.reportService = reportService;
        this.authService = authService;
        this.frontendBaseUrl = frontendBaseUrl.replaceAll("/+$", "");
    }

    public record ShareLinkResponse(String url, Instant createdAt) {
    }

    public record ShareStatusResponse(boolean active, Instant createdAt) {
    }

    public record SharedReportResponse(String orgName, Instant sharedAt, ReportResponse report) {
    }

    /** Maakt een nieuwe deellink aan; een eerdere link voor dit dossier vervalt. */
    @PostMapping("/api/assessments/{id}/share")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ShareLinkResponse create(@PathVariable String id, UserEntity user) {
        AssessmentEntity assessment = findOwned(id, user);
        shareLinks.deleteByAssessment(assessment);

        String token = authService.newToken();
        ShareLinkEntity link = new ShareLinkEntity();
        link.setTokenHash(AuthService.hash(token));
        link.setAssessment(assessment);
        shareLinks.save(link);
        return new ShareLinkResponse(frontendBaseUrl + "/delen/" + token, link.getCreatedAt());
    }

    @GetMapping("/api/assessments/{id}/share")
    @Transactional(readOnly = true)
    public ShareStatusResponse status(@PathVariable String id, UserEntity user) {
        AssessmentEntity assessment = findOwned(id, user);
        return shareLinks.findByAssessment(assessment).stream()
                .findFirst()
                .map(link -> new ShareStatusResponse(true, link.getCreatedAt()))
                .orElseGet(() -> new ShareStatusResponse(false, null));
    }

    @DeleteMapping("/api/assessments/{id}/share")
    @Transactional
    public Map<String, Boolean> revoke(@PathVariable String id, UserEntity user) {
        AssessmentEntity assessment = findOwned(id, user);
        shareLinks.deleteByAssessment(assessment);
        return Map.of("ok", true);
    }

    /** Publiek: het rapport achter een deellink, zonder aanmelding. */
    @GetMapping("/api/share/{token}")
    @Transactional(readOnly = true)
    public SharedReportResponse shared(@PathVariable String token) {
        ShareLinkEntity link = shareLinks.findByTokenHash(AuthService.hash(token))
                .orElseThrow(() -> new NotFoundException("Deellink niet gevonden of ingetrokken."));
        AssessmentEntity assessment = link.getAssessment();
        return new SharedReportResponse(assessment.getOrgName(), link.getCreatedAt(),
                reportService.buildReport(assessment));
    }

    private AssessmentEntity findOwned(String id, UserEntity user) {
        return assessments.findById(id)
                .filter(assessment -> AssessmentController.isOwnedBy(assessment, user))
                .orElseThrow(() -> new NotFoundException("Sessie niet gevonden."));
    }
}
