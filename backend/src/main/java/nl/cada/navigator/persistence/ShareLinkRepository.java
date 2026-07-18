package nl.cada.navigator.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ShareLinkRepository extends JpaRepository<ShareLinkEntity, String> {

    Optional<ShareLinkEntity> findByTokenHash(String tokenHash);

    List<ShareLinkEntity> findByAssessment(AssessmentEntity assessment);

    void deleteByAssessment(AssessmentEntity assessment);
}
