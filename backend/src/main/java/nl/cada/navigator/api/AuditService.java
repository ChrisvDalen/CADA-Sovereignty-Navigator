package nl.cada.navigator.api;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import nl.cada.navigator.persistence.AuditEntity;
import nl.cada.navigator.persistence.AuditRepository;
import nl.cada.navigator.persistence.UserEntity;

/** Legt wijzigingen in de referentiedata vast in de audittrail. */
@Service
public class AuditService {

    public static final String SUPPLIER = "supplier";

    private final AuditRepository audit;

    public AuditService(AuditRepository audit) {
        this.audit = audit;
    }

    public void record(UserEntity actor, String action, String entityType, String entityName, String details) {
        String email = actor == null ? "onbekend" : actor.getEmail();
        audit.save(new AuditEntity(email, action, entityType, entityName, details));
    }

    public List<AuditEntity> recent(String entityType, int limit) {
        return audit.findByEntityTypeOrderByCreatedAtDesc(entityType, PageRequest.of(0, limit));
    }
}
