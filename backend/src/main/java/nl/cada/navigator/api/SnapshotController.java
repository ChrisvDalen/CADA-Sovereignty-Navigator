package nl.cada.navigator.api;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import nl.cada.navigator.api.SnapshotService.SnapshotData;
import nl.cada.navigator.api.SnapshotService.SnapshotDiff;
import nl.cada.navigator.persistence.AssessmentEntity;
import nl.cada.navigator.persistence.AssessmentRepository;
import nl.cada.navigator.persistence.SnapshotEntity;
import nl.cada.navigator.persistence.SnapshotRepository;
import nl.cada.navigator.persistence.UserEntity;

/**
 * Dossierversionering: momentopnames per kwartaal en een diff die de
 * voortgang toont (bijv. "Azure-toepassingen: 12 → 8 sinds Q1").
 */
@RestController
@RequestMapping("/api/assessments/{id}/snapshots")
public class SnapshotController {

    private final AssessmentRepository assessments;
    private final SnapshotRepository snapshots;
    private final ReportService reportService;
    private final SnapshotService snapshotService;

    public SnapshotController(AssessmentRepository assessments, SnapshotRepository snapshots,
            ReportService reportService, SnapshotService snapshotService) {
        this.assessments = assessments;
        this.snapshots = snapshots;
        this.reportService = reportService;
        this.snapshotService = snapshotService;
    }

    public record CreateSnapshotPayload(String label) {
    }

    public record SnapshotSummary(String id, String label, Instant createdAt, int applicationCount, int gapCount) {
        static SnapshotSummary from(SnapshotEntity s) {
            return new SnapshotSummary(s.getId(), s.getLabel(), s.getCreatedAt(),
                    s.getApplicationCount(), s.getGapCount());
        }
    }

    public record SnapshotDetail(String id, String label, Instant createdAt, SnapshotData data) {
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public SnapshotSummary create(@PathVariable String id,
            @RequestBody(required = false) CreateSnapshotPayload payload, UserEntity user) {
        AssessmentEntity assessment = findOwned(id, user);
        String label = payload == null || payload.label() == null ? "" : payload.label().trim();
        if (label.isEmpty()) {
            label = defaultLabel();
        }
        SnapshotData data = snapshotService.summarise(reportService.buildReport(assessment));

        SnapshotEntity snapshot = new SnapshotEntity();
        snapshot.setAssessment(assessment);
        snapshot.setLabel(label);
        snapshot.setApplicationCount(data.applicationCount());
        snapshot.setGapCount(data.gapCount());
        snapshot.setDataJson(snapshotService.toJson(data));
        return SnapshotSummary.from(snapshots.save(snapshot));
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<SnapshotSummary> list(@PathVariable String id, UserEntity user) {
        AssessmentEntity assessment = findOwned(id, user);
        return snapshots.findByAssessmentOrderByCreatedAtAsc(assessment).stream()
                .map(SnapshotSummary::from)
                .toList();
    }

    @GetMapping("/{snapshotId}")
    @Transactional(readOnly = true)
    public SnapshotDetail get(@PathVariable String id, @PathVariable String snapshotId, UserEntity user) {
        AssessmentEntity assessment = findOwned(id, user);
        SnapshotEntity snapshot = findSnapshot(snapshotId, assessment);
        return new SnapshotDetail(snapshot.getId(), snapshot.getLabel(), snapshot.getCreatedAt(),
                snapshotService.fromJson(snapshot.getDataJson()));
    }

    @DeleteMapping("/{snapshotId}")
    @Transactional
    public Map<String, Boolean> delete(@PathVariable String id, @PathVariable String snapshotId, UserEntity user) {
        AssessmentEntity assessment = findOwned(id, user);
        snapshots.delete(findSnapshot(snapshotId, assessment));
        return Map.of("ok", true);
    }

    /**
     * Diff van {@code from} naar {@code to}. {@code to} mag "current" zijn om de
     * momentopname met de huidige stand van het dossier te vergelijken.
     */
    @GetMapping("/diff")
    @Transactional(readOnly = true)
    public SnapshotDiff diff(@PathVariable String id,
            @RequestParam String from, @RequestParam(defaultValue = "current") String to, UserEntity user) {
        AssessmentEntity assessment = findOwned(id, user);
        SnapshotEntity fromSnapshot = findSnapshot(from, assessment);
        SnapshotData fromData = snapshotService.fromJson(fromSnapshot.getDataJson());

        String toLabel;
        SnapshotData toData;
        if ("current".equalsIgnoreCase(to)) {
            toLabel = "Huidige stand";
            toData = snapshotService.summarise(reportService.buildReport(assessment));
        } else {
            SnapshotEntity toSnapshot = findSnapshot(to, assessment);
            toLabel = toSnapshot.getLabel();
            toData = snapshotService.fromJson(toSnapshot.getDataJson());
        }
        return snapshotService.diff(fromSnapshot.getLabel(), fromData, toLabel, toData);
    }

    private String defaultLabel() {
        java.time.LocalDate today = java.time.LocalDate.now();
        int quarter = (today.getMonthValue() - 1) / 3 + 1;
        return "Q" + quarter + " " + today.getYear();
    }

    private AssessmentEntity findOwned(String id, UserEntity user) {
        return assessments.findById(id)
                .filter(assessment -> AssessmentController.isOwnedBy(assessment, user))
                .orElseThrow(() -> new NotFoundException("Sessie niet gevonden."));
    }

    private SnapshotEntity findSnapshot(String snapshotId, AssessmentEntity assessment) {
        return snapshots.findByIdAndAssessment(snapshotId, assessment)
                .orElseThrow(() -> new NotFoundException("Momentopname niet gevonden."));
    }
}
