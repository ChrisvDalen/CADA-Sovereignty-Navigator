package nl.cada.navigator.api;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import nl.cada.navigator.api.MetaController.SupplierDetail;
import nl.cada.navigator.domain.CadaDomain;
import nl.cada.navigator.persistence.SupplierEntity;
import nl.cada.navigator.persistence.SupplierRepository;

/** Beheer van de leveranciersreferentiedata (zonder redeploy). */
@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

    private final SupplierRepository suppliers;

    public SupplierController(SupplierRepository suppliers) {
        this.suppliers = suppliers;
    }

    public record SupplierPayload(
            String name,
            Integer maxLevel,
            String notes,
            String jurisdiction,
            String ownership,
            String certifications,
            LocalDate lastVerified) {
    }

    @GetMapping
    public List<SupplierDetail> list() {
        return suppliers.findAllByOrderByPositionAsc().stream().map(SupplierController::toDetail).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public SupplierDetail create(@RequestBody(required = false) SupplierPayload payload) {
        SupplierEntity entity = new SupplierEntity();
        apply(entity, validate(payload, null));
        int nextPosition = suppliers.findAllByOrderByPositionAsc().stream()
                .mapToInt(SupplierEntity::getPosition)
                .max()
                .orElse(-1) + 1;
        entity.setPosition(nextPosition);
        return toDetail(suppliers.save(entity));
    }

    @PutMapping("/{id}")
    @Transactional
    public SupplierDetail update(@PathVariable String id, @RequestBody(required = false) SupplierPayload payload) {
        SupplierEntity entity = suppliers.findById(id)
                .orElseThrow(() -> new NotFoundException("Leverancier niet gevonden."));
        apply(entity, validate(payload, id));
        return toDetail(entity);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public Map<String, Boolean> delete(@PathVariable String id) {
        SupplierEntity entity = suppliers.findById(id)
                .orElseThrow(() -> new NotFoundException("Leverancier niet gevonden."));
        suppliers.delete(entity);
        return Map.of("ok", true);
    }

    private SupplierPayload validate(SupplierPayload payload, String selfId) {
        if (payload == null) {
            throw new ValidationException("Ongeldige aanvraag.");
        }
        String name = payload.name() == null ? "" : payload.name().trim();
        if (name.isEmpty()) {
            throw new ValidationException("Geef de leverancier een naam.");
        }
        if (CadaDomain.OTHER_SUPPLIER.equalsIgnoreCase(name)) {
            throw new ValidationException("De naam 'Anders' is gereserveerd voor eigen opgave.");
        }
        suppliers.findByName(name).ifPresent(existing -> {
            if (!existing.getId().equals(selfId)) {
                throw new ValidationException("Er bestaat al een leverancier met deze naam.");
            }
        });
        Integer maxLevel = payload.maxLevel();
        if (maxLevel == null || maxLevel < 1 || maxLevel > 4) {
            throw new ValidationException("Kies een maximaal haalbaar niveau van 1 t/m 4.");
        }
        return new SupplierPayload(name, maxLevel, payload.notes(), payload.jurisdiction(),
                payload.ownership(), payload.certifications(), payload.lastVerified());
    }

    private static void apply(SupplierEntity entity, SupplierPayload payload) {
        entity.setName(payload.name());
        entity.setMaxLevel(payload.maxLevel());
        entity.setNotes(payload.notes() == null ? "" : payload.notes().trim());
        entity.setJurisdiction(payload.jurisdiction() == null ? "" : payload.jurisdiction().trim());
        entity.setOwnership(payload.ownership() == null ? "" : payload.ownership().trim());
        entity.setCertifications(payload.certifications() == null ? "" : payload.certifications().trim());
        entity.setLastVerified(payload.lastVerified());
    }

    private static SupplierDetail toDetail(SupplierEntity s) {
        return new SupplierDetail(s.getId(), s.getName(), s.getMaxLevel(), s.getNotes(),
                s.getJurisdiction(), s.getOwnership(), s.getCertifications(), s.getLastVerified());
    }
}
