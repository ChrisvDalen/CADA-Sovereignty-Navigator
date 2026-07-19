package nl.cada.navigator.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SnapshotRepository extends JpaRepository<SnapshotEntity, String> {

    List<SnapshotEntity> findByAssessmentOrderByCreatedAtAsc(AssessmentEntity assessment);

    Optional<SnapshotEntity> findByIdAndAssessment(String id, AssessmentEntity assessment);
}
