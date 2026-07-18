package nl.cada.navigator.api.dto;

import java.time.Instant;
import java.util.List;

import nl.cada.navigator.persistence.AssessmentEntity;

public record AssessmentResponse(
        String id,
        String orgName,
        Instant createdAt,
        List<ApplicationResponse> applications) {

    public static AssessmentResponse from(AssessmentEntity assessment) {
        return new AssessmentResponse(
                assessment.getId(),
                assessment.getOrgName(),
                assessment.getCreatedAt(),
                assessment.getApplications().stream().map(ApplicationResponse::from).toList());
    }
}
