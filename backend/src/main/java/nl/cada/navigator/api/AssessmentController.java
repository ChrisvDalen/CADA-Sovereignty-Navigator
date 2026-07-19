package nl.cada.navigator.api;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import nl.cada.navigator.api.ApplicationInputParser.ParsedApplication;
import nl.cada.navigator.api.dto.ApplicationPayload;
import nl.cada.navigator.api.dto.ApplicationResponse;
import nl.cada.navigator.api.dto.AssessmentResponse;
import nl.cada.navigator.api.dto.ReportResponse;
import nl.cada.navigator.persistence.AssessmentEntity;
import nl.cada.navigator.persistence.AssessmentRepository;
import nl.cada.navigator.persistence.CloudApplicationEntity;
import nl.cada.navigator.persistence.CloudApplicationRepository;
import nl.cada.navigator.persistence.UserEntity;

@RestController
@RequestMapping("/api/assessments")
public class AssessmentController {

    private final AssessmentRepository assessments;
    private final CloudApplicationRepository applications;
    private final ApplicationInputParser parser;
    private final ReportService reportService;

    public AssessmentController(AssessmentRepository assessments, CloudApplicationRepository applications,
            ApplicationInputParser parser, ReportService reportService) {
        this.assessments = assessments;
        this.applications = applications;
        this.parser = parser;
        this.reportService = reportService;
    }

    public record CreateAssessmentPayload(String orgName) {
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AssessmentResponse create(@RequestBody(required = false) CreateAssessmentPayload payload, UserEntity user) {
        String orgName = payload == null || payload.orgName() == null ? "" : payload.orgName().trim();
        if (orgName.isEmpty()) {
            throw new ValidationException("Organisatienaam is verplicht.");
        }
        AssessmentEntity assessment = new AssessmentEntity();
        assessment.setOrgName(orgName);
        assessment.setOwner(user);
        return AssessmentResponse.from(assessments.save(assessment));
    }

    public record AssessmentSummary(
            String id,
            String orgName,
            java.time.Instant createdAt,
            int applicationCount,
            int gapCount,
            int maxRecommendedLevel) {
    }

    /** Portfolio-overzicht voor het dashboard: de eigen dossiers met gap-statistiek. */
    @GetMapping
    @Transactional(readOnly = true)
    public java.util.List<AssessmentSummary> list(UserEntity user) {
        return assessments.findByOwner(user).stream()
                .sorted(java.util.Comparator.comparing(AssessmentEntity::getCreatedAt).reversed())
                .map(assessment -> {
                    var report = reportService.buildReport(assessment);
                    int gaps = (int) report.rows().stream()
                            .filter(r -> "GAP".equals(r.statusLabel()))
                            .count();
                    int maxLevel = report.rows().stream()
                            .mapToInt(r -> r.app().recommendedLevel())
                            .max()
                            .orElse(0);
                    return new AssessmentSummary(assessment.getId(), assessment.getOrgName(),
                            assessment.getCreatedAt(), report.rows().size(), gaps, maxLevel);
                })
                .toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public AssessmentResponse get(@PathVariable String id, UserEntity user) {
        return AssessmentResponse.from(find(id, user));
    }

    @PatchMapping("/{id}")
    @Transactional
    public AssessmentResponse rename(@PathVariable String id,
            @RequestBody(required = false) CreateAssessmentPayload payload, UserEntity user) {
        String orgName = payload == null || payload.orgName() == null ? "" : payload.orgName().trim();
        if (orgName.isEmpty()) {
            throw new ValidationException("Organisatienaam is verplicht.");
        }
        AssessmentEntity assessment = find(id, user);
        assessment.setOrgName(orgName);
        return AssessmentResponse.from(assessment);
    }

    @GetMapping("/{id}/report")
    @Transactional(readOnly = true)
    public ReportResponse report(@PathVariable String id, UserEntity user) {
        return reportService.buildReport(find(id, user));
    }

    @PostMapping("/{id}/applications")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ApplicationResponse addApplication(@PathVariable String id,
            @RequestBody(required = false) ApplicationPayload payload, UserEntity user) {
        AssessmentEntity assessment = find(id, user);
        ParsedApplication data = parser.parse(payload);

        CloudApplicationEntity app = new CloudApplicationEntity();
        app.setAssessment(assessment);
        apply(app, data);
        return ApplicationResponse.from(applications.save(app));
    }

    static void apply(CloudApplicationEntity app, ParsedApplication data) {
        app.setName(data.name());
        app.setDataTypes(data.dataTypes());
        app.setRegulations(data.regulations());
        app.setImpactLevel(data.impactLevel());
        app.setCriticalInfra(data.criticalInfra());
        app.setAiProcessing(data.aiProcessing());
        app.setSuppliers(data.suppliers());
        app.setSupplierOther(data.supplierOther());
        app.setRecommendedLevel(data.recommendedLevel());
        app.setLevelReason(data.levelReason());
    }

    /** Zoekt een dossier van deze gebruiker; andermans dossiers geven 404. */
    private AssessmentEntity find(String id, UserEntity user) {
        return assessments.findById(id)
                .filter(assessment -> isOwnedBy(assessment, user))
                .orElseThrow(() -> new NotFoundException("Sessie niet gevonden."));
    }

    static boolean isOwnedBy(AssessmentEntity assessment, UserEntity user) {
        return assessment.getOwner() != null && user != null
                && assessment.getOwner().getId().equals(user.getId());
    }
}
