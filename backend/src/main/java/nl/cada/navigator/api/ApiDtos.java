package nl.cada.navigator.api;

import java.util.List;

/** Request- en responsevormen van de REST-API. */
public final class ApiDtos {

    private ApiDtos() {
    }

    public record AssessmentRequest(String orgName) {
    }

    public record ApplicationRequest(
            String name,
            List<String> dataTypes,
            List<String> regulations,
            String impactLevel,
            Boolean criticalInfra,
            List<String> suppliers,
            String supplierOther) {
    }

    public record ApplicationDto(
            String id,
            String name,
            List<String> dataTypes,
            List<String> regulations,
            String impactLevel,
            boolean criticalInfra,
            List<String> suppliers,
            String supplierOther,
            int recommendedLevel) {
    }

    public record AssessmentDto(
            String id, String orgName, String createdAt, List<ApplicationDto> applications) {
    }

    public record ErrorResponse(String error) {
    }
}
