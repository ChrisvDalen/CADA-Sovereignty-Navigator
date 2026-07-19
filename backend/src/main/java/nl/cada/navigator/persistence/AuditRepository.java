package nl.cada.navigator.persistence;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditRepository extends JpaRepository<AuditEntity, String> {

    List<AuditEntity> findByEntityTypeOrderByCreatedAtDesc(String entityType, Pageable pageable);
}
