package nl.cada.navigator.persistence;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Audittrail-regel: wie wijzigde wat in de referentiedata, en wanneer. */
@Entity
@Table(name = "audit_entry")
public class AuditEntity {

    @Id
    private String id = UUID.randomUUID().toString();

    private Instant createdAt = Instant.now();

    /** E-mailadres van de gebruiker die de wijziging maakte. */
    private String actor;

    /** CREATE | UPDATE | DELETE */
    private String action;

    /** Type gewijzigde entiteit, bijv. "supplier". */
    private String entityType;

    private String entityName;

    @Column(length = 1024)
    private String details;

    protected AuditEntity() {
    }

    public AuditEntity(String actor, String action, String entityType, String entityName, String details) {
        this.actor = actor;
        this.action = action;
        this.entityType = entityType;
        this.entityName = entityName;
        this.details = details;
    }

    public String getId() {
        return id;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public String getActor() {
        return actor;
    }

    public String getAction() {
        return action;
    }

    public String getEntityType() {
        return entityType;
    }

    public String getEntityName() {
        return entityName;
    }

    public String getDetails() {
        return details;
    }
}
