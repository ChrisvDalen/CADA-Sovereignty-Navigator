package nl.cada.navigator.persistence;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

/** Eén geprofileerde cloudtoepassing binnen een assessment. */
@Entity
@Table(name = "cloud_application")
public class CloudApplicationEntity {

    @Id
    private String id = UUID.randomUUID().toString();

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id")
    private AssessmentEntity assessment;

    private String name;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "application_data_type", joinColumns = @JoinColumn(name = "application_id"))
    @OrderColumn(name = "position")
    @Column(name = "data_type")
    private List<String> dataTypes = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "application_regulation", joinColumns = @JoinColumn(name = "application_id"))
    @OrderColumn(name = "position")
    @Column(name = "regulation")
    private List<String> regulations = new ArrayList<>();

    private String impactLevel;

    private boolean criticalInfra;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "application_supplier", joinColumns = @JoinColumn(name = "application_id"))
    @OrderColumn(name = "position")
    @Column(name = "supplier")
    private List<String> suppliers = new ArrayList<>();

    private String supplierOther = "";

    private int recommendedLevel;

    private Instant createdAt = Instant.now();

    public String getId() {
        return id;
    }

    public AssessmentEntity getAssessment() {
        return assessment;
    }

    public void setAssessment(AssessmentEntity assessment) {
        this.assessment = assessment;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<String> getDataTypes() {
        return dataTypes;
    }

    public void setDataTypes(List<String> dataTypes) {
        this.dataTypes = new ArrayList<>(dataTypes);
    }

    public List<String> getRegulations() {
        return regulations;
    }

    public void setRegulations(List<String> regulations) {
        this.regulations = new ArrayList<>(regulations);
    }

    public String getImpactLevel() {
        return impactLevel;
    }

    public void setImpactLevel(String impactLevel) {
        this.impactLevel = impactLevel;
    }

    public boolean isCriticalInfra() {
        return criticalInfra;
    }

    public void setCriticalInfra(boolean criticalInfra) {
        this.criticalInfra = criticalInfra;
    }

    public List<String> getSuppliers() {
        return suppliers;
    }

    public void setSuppliers(List<String> suppliers) {
        this.suppliers = new ArrayList<>(suppliers);
    }

    public String getSupplierOther() {
        return supplierOther;
    }

    public void setSupplierOther(String supplierOther) {
        this.supplierOther = supplierOther;
    }

    public int getRecommendedLevel() {
        return recommendedLevel;
    }

    public void setRecommendedLevel(int recommendedLevel) {
        this.recommendedLevel = recommendedLevel;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
