package nl.cada.navigator.api;

import nl.cada.navigator.api.ApiDtos.ApplicationDto;
import nl.cada.navigator.api.ApiDtos.ApplicationRequest;
import nl.cada.navigator.api.ApiDtos.AssessmentDto;
import nl.cada.navigator.api.ApiDtos.AssessmentRequest;
import nl.cada.navigator.persistence.NavigatorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assessments")
public class AssessmentController {

    private final NavigatorRepository repository;

    public AssessmentController(NavigatorRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AssessmentDto create(@RequestBody(required = false) AssessmentRequest request) {
        return repository.createAssessment(requireOrgName(request));
    }

    @GetMapping("/{id}")
    public AssessmentDto get(@PathVariable String id) {
        return repository.findAssessment(id)
                .orElseThrow(() -> new NotFoundException("Sessie niet gevonden."));
    }

    @PatchMapping("/{id}")
    public AssessmentDto rename(@PathVariable String id, @RequestBody(required = false) AssessmentRequest request) {
        if (!repository.updateAssessment(id, requireOrgName(request))) {
            throw new NotFoundException("Sessie niet gevonden.");
        }
        return repository.findAssessment(id)
                .orElseThrow(() -> new NotFoundException("Sessie niet gevonden."));
    }

    @PostMapping("/{id}/applications")
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationDto addApplication(@PathVariable String id, @RequestBody(required = false) ApplicationRequest request) {
        if (!repository.assessmentExists(id)) {
            throw new NotFoundException("Sessie niet gevonden.");
        }
        return repository.createApplication(id, ApplicationValidator.validate(request));
    }

    private static String requireOrgName(AssessmentRequest request) {
        var orgName = request == null || request.orgName() == null ? "" : request.orgName().trim();
        if (orgName.isEmpty()) {
            throw new InvalidPayloadException("Organisatienaam is verplicht.");
        }
        return orgName;
    }
}
