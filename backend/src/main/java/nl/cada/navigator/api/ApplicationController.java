package nl.cada.navigator.api;

import java.util.Map;
import nl.cada.navigator.api.ApiDtos.ApplicationDto;
import nl.cada.navigator.api.ApiDtos.ApplicationRequest;
import nl.cada.navigator.persistence.NavigatorRepository;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final NavigatorRepository repository;

    public ApplicationController(NavigatorRepository repository) {
        this.repository = repository;
    }

    @PutMapping("/{id}")
    public ApplicationDto update(@PathVariable String id, @RequestBody(required = false) ApplicationRequest request) {
        var validated = ApplicationValidator.validate(request);
        return repository.updateApplication(id, validated)
                .orElseThrow(() -> new NotFoundException("Toepassing niet gevonden."));
    }

    @DeleteMapping("/{id}")
    public Map<String, Boolean> delete(@PathVariable String id) {
        if (!repository.deleteApplication(id)) {
            throw new NotFoundException("Toepassing niet gevonden.");
        }
        return Map.of("ok", true);
    }
}
