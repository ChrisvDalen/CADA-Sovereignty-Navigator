package nl.cada.navigator.persistence;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Momentopname van het gap-rapport van een dossier op een bepaald moment
 * (bijv. per kwartaal), zodat voortgang zichtbaar wordt via een diff. De
 * berekende samenvatting wordt als JSON opgeslagen.
 */
@Entity
@Table(name = "assessment_snapshot")
public class SnapshotEntity {

    @Id
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assessment_id")
    private AssessmentEntity assessment;

    @Column(nullable = false)
    private String label;

    private Instant createdAt = Instant.now();

    private int applicationCount;

    private int gapCount;

    @Lob
    @Column(nullable = false, columnDefinition = "CLOB")
    private String dataJson;

    public String getId() {
        return id;
    }

    public AssessmentEntity getAssessment() {
        return assessment;
    }

    public void setAssessment(AssessmentEntity assessment) {
        this.assessment = assessment;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public int getApplicationCount() {
        return applicationCount;
    }

    public void setApplicationCount(int applicationCount) {
        this.applicationCount = applicationCount;
    }

    public int getGapCount() {
        return gapCount;
    }

    public void setGapCount(int gapCount) {
        this.gapCount = gapCount;
    }

    public String getDataJson() {
        return dataJson;
    }

    public void setDataJson(String dataJson) {
        this.dataJson = dataJson;
    }
}
