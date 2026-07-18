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
    public AssessmentResponse create(@RequestBody(required = false) CreateAssessmentPayload payload) {
        String orgName = payload == null || payload.orgName() == null ? "" : payload.orgName().trim();
        if (orgName.isEmpty()) {
            throw new ValidationException("Organisatienaam is verplicht.");
        }
        AssessmentEntity assessment = new AssessmentEntity();
        assessment.setOrgName(orgName);
        return AssessmentResponse.from(assessments.save(assessment));
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public AssessmentResponse get(@PathVariable String id) {
        return AssessmentResponse.from(find(id));
    }

    @PatchMapping("/{id}")
    @Transactional
    public AssessmentResponse rename(@PathVariable String id,
            @RequestBody(required = false) CreateAssessmentPayload payload) {
        String orgName = payload == null || payload.orgName() == null ? "" : payload.orgName().trim();
        if (orgName.isEmpty()) {
            throw new ValidationException("Organisatienaam is verplicht.");
        }
        AssessmentEntity assessment = find(id);
        assessment.setOrgName(orgName);
        return AssessmentResponse.from(assessment);
    }

    @GetMapping("/{id}/report")
    @Transactional(readOnly = true)
    public ReportResponse report(@PathVariable String id) {
        return reportService.buildReport(find(id));
    }

    @PostMapping("/{id}/applications")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ApplicationResponse addApplication(@PathVariable String id,
            @RequestBody(required = false) ApplicationPayload payload) {
        AssessmentEntity assessment = find(id);
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
        app.setSuppliers(data.suppliers());
        app.setSupplierOther(data.supplierOther());
        app.setRecommendedLevel(data.recommendedLevel());
    }

    private AssessmentEntity find(String id) {
        return assessments.findById(id)
                .orElseThrow(() -> new NotFoundException("Sessie niet gevonden."));
    }
}
