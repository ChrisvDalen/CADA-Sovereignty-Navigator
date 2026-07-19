package nl.cada.navigator.api;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
import nl.cada.navigator.persistence.ShareLinkRepository;
import nl.cada.navigator.persistence.SnapshotRepository;
import nl.cada.navigator.persistence.UserEntity;

@RestController
@RequestMapping("/api/assessments")
public class AssessmentController {

    private final AssessmentRepository assessments;
    private final CloudApplicationRepository applications;
    private final ApplicationInputParser parser;
    private final ReportService reportService;
    private final SnapshotRepository snapshots;
    private final ShareLinkRepository shareLinks;

    public AssessmentController(AssessmentRepository assessments, CloudApplicationRepository applications,
            ApplicationInputParser parser, ReportService reportService,
            SnapshotRepository snapshots, ShareLinkRepository shareLinks) {
        this.assessments = assessments;
        this.applications = applications;
        this.parser = parser;
        this.reportService = reportService;
        this.snapshots = snapshots;
        this.shareLinks = shareLinks;
    }

    public record CreateAssessmentPayload(String orgName) {
    }

    public record UpdateAssessmentPayload(String orgName, Boolean archived) {
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
            int maxRecommendedLevel,
            boolean archived,
            Map<Integer, Integer> levelCounts) {
    }

    /**
     * Portfolio-overzicht voor het dashboard: de eigen dossiers met
     * gap-statistiek en de niveauverdeling per dossier. Gearchiveerde dossiers
     * staan er standaard niet in; {@code includeArchived=true} toont ze wel.
     */
    @GetMapping
    @Transactional(readOnly = true)
    public java.util.List<AssessmentSummary> list(
            @RequestParam(defaultValue = "false") boolean includeArchived, UserEntity user) {
        return assessments.findByOwner(user).stream()
                .filter(assessment -> includeArchived || !assessment.isArchived())
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
                    Map<Integer, Integer> levelCounts = new java.util.TreeMap<>();
                    report.rows().forEach(r -> levelCounts.merge(r.app().recommendedLevel(), 1, Integer::sum));
                    return new AssessmentSummary(assessment.getId(), assessment.getOrgName(),
                            assessment.getCreatedAt(), report.rows().size(), gaps, maxLevel,
                            assessment.isArchived(), levelCounts);
                })
                .toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public AssessmentResponse get(@PathVariable String id, UserEntity user) {
        return AssessmentResponse.from(find(id, user));
    }

    /** Hernoemt en/of (de)archiveert een dossier; alleen meegegeven velden wijzigen. */
    @PatchMapping("/{id}")
    @Transactional
    public AssessmentResponse update(@PathVariable String id,
            @RequestBody(required = false) UpdateAssessmentPayload payload, UserEntity user) {
        AssessmentEntity assessment = find(id, user);
        if (payload != null && payload.orgName() != null) {
            String orgName = payload.orgName().trim();
            if (orgName.isEmpty()) {
                throw new ValidationException("Organisatienaam is verplicht.");
            }
            assessment.setOrgName(orgName);
        }
        if (payload != null && payload.archived() != null) {
            assessment.setArchived(payload.archived());
        }
        return AssessmentResponse.from(assessment);
    }

    /** Verwijdert een dossier met alle toepassingen, momentopnames en deellinks. */
    @DeleteMapping("/{id}")
    @Transactional
    public Map<String, Boolean> delete(@PathVariable String id, UserEntity user) {
        AssessmentEntity assessment = find(id, user);
        // Losse entiteiten met een FK naar het dossier eerst opruimen.
        shareLinks.deleteByAssessment(assessment);
        snapshots.findByAssessmentOrderByCreatedAtAsc(assessment).forEach(snapshots::delete);
        assessments.delete(assessment);
        return Map.of("ok", true);
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

    public record ImportPayload(java.util.List<ApplicationPayload> applications) {
    }

    public record ImportError(int row, String name, String error) {
    }

    public record ImportResult(int imported, int failed,
            java.util.List<ApplicationResponse> applications,
            java.util.List<ImportError> errors) {
    }

    /**
     * Bulk-import vanuit een applicatieregister (Excel/CMDB). De frontend leest
     * het bestand in en levert per rij een payload; ongeldige rijen worden
     * overgeslagen en teruggemeld, zodat een enkele foute rij de rest niet
     * blokkeert.
     */
    @PostMapping("/{id}/applications/import")
    @Transactional
    public ImportResult importApplications(@PathVariable String id,
            @RequestBody(required = false) ImportPayload payload, UserEntity user) {
        AssessmentEntity assessment = find(id, user);
        java.util.List<ApplicationPayload> rows =
                payload == null || payload.applications() == null ? java.util.List.of() : payload.applications();
        if (rows.isEmpty()) {
            throw new ValidationException("Het bestand bevat geen toepassingen om te importeren.");
        }

        java.util.List<ApplicationResponse> imported = new java.util.ArrayList<>();
        java.util.List<ImportError> errors = new java.util.ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            ApplicationPayload row = rows.get(i);
            try {
                ParsedApplication data = parser.parse(row);
                CloudApplicationEntity app = new CloudApplicationEntity();
                app.setAssessment(assessment);
                apply(app, data);
                imported.add(ApplicationResponse.from(applications.save(app)));
            } catch (ValidationException e) {
                String name = row == null || row.name() == null ? "" : row.name();
                // Rijnummer is 1-gebaseerd voor de gebruiker.
                errors.add(new ImportError(i + 1, name, e.getMessage()));
            }
        }
        return new ImportResult(imported.size(), errors.size(), imported, errors);
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
