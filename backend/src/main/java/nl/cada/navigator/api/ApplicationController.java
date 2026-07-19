package nl.cada.navigator.api;

import java.util.Map;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import nl.cada.navigator.api.ApplicationInputParser.ParsedApplication;
import nl.cada.navigator.api.dto.ApplicationPayload;
import nl.cada.navigator.api.dto.ApplicationResponse;
import nl.cada.navigator.persistence.CloudApplicationEntity;
import nl.cada.navigator.persistence.CloudApplicationRepository;
import nl.cada.navigator.persistence.UserEntity;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final CloudApplicationRepository applications;
    private final ApplicationInputParser parser;

    public ApplicationController(CloudApplicationRepository applications, ApplicationInputParser parser) {
        this.applications = applications;
        this.parser = parser;
    }

    @PutMapping("/{id}")
    @Transactional
    public ApplicationResponse update(@PathVariable String id,
            @RequestBody(required = false) ApplicationPayload payload, UserEntity user) {
        ParsedApplication data = parser.parse(payload);
        CloudApplicationEntity app = find(id, user);
        AssessmentController.apply(app, data);
        return ApplicationResponse.from(app);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public Map<String, Boolean> delete(@PathVariable String id, UserEntity user) {
        CloudApplicationEntity app = find(id, user);
        applications.delete(app);
        return Map.of("ok", true);
    }

    /** Zoekt een toepassing binnen een dossier van deze gebruiker; anders 404. */
    private CloudApplicationEntity find(String id, UserEntity user) {
        return applications.findById(id)
                .filter(app -> AssessmentController.isOwnedBy(app.getAssessment(), user))
                .orElseThrow(() -> new NotFoundException("Toepassing niet gevonden."));
    }
}
