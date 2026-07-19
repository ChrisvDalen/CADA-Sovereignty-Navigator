package nl.cada.navigator.persistence;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AssessmentRepository extends JpaRepository<AssessmentEntity, String> {

    List<AssessmentEntity> findByOwner(UserEntity owner);
}
