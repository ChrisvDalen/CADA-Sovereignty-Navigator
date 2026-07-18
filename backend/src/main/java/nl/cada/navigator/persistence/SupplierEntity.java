package nl.cada.navigator.persistence;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Referentiedata per cloudleverancier: het maximaal haalbare
 * soevereiniteitsniveau plus de onderbouwing (jurisdictie, eigendom,
 * certificeringen). Beheerbaar zonder redeploy via /api/suppliers.
 */
@Entity
@Table(name = "supplier")
public class SupplierEntity {

    @Id
    private String id = UUID.randomUUID().toString();

    @Column(unique = true)
    private String name;

    private int maxLevel;

    @Column(length = 1024)
    private String notes = "";

    private String jurisdiction = "";

    private String ownership = "";

    private String certifications = "";

    private LocalDate lastVerified;

    private int position;

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getMaxLevel() {
        return maxLevel;
    }

    public void setMaxLevel(int maxLevel) {
        this.maxLevel = maxLevel;
    }

    public String getNotes() {
        return notes == null ? "" : notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getJurisdiction() {
        return jurisdiction == null ? "" : jurisdiction;
    }

    public void setJurisdiction(String jurisdiction) {
        this.jurisdiction = jurisdiction;
    }

    public String getOwnership() {
        return ownership == null ? "" : ownership;
    }

    public void setOwnership(String ownership) {
        this.ownership = ownership;
    }

    public String getCertifications() {
        return certifications == null ? "" : certifications;
    }

    public void setCertifications(String certifications) {
        this.certifications = certifications;
    }

    public LocalDate getLastVerified() {
        return lastVerified;
    }

    public void setLastVerified(LocalDate lastVerified) {
        this.lastVerified = lastVerified;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }
}
