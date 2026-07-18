package nl.cada.navigator.api.dto;

import java.util.List;

import nl.cada.navigator.persistence.CloudApplicationEntity;

public record ApplicationResponse(
        String id,
        String name,
        List<String> dataTypes,
        List<String> regulations,
        String impactLevel,
        boolean criticalInfra,
        boolean aiProcessing,
        List<String> suppliers,
        String supplierOther,
        int recommendedLevel,
        String levelReason) {

    public static ApplicationResponse from(CloudApplicationEntity app) {
        return new ApplicationResponse(
                app.getId(),
                app.getName(),
                List.copyOf(app.getDataTypes()),
                List.copyOf(app.getRegulations()),
                app.getImpactLevel(),
                app.isCriticalInfra(),
                app.isAiProcessing(),
                List.copyOf(app.getSuppliers()),
                app.getSupplierOther(),
                Math.clamp(app.getRecommendedLevel(), 1, 4),
                app.getLevelReason());
    }
}
