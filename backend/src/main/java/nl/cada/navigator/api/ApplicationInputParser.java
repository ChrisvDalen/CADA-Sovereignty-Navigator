package nl.cada.navigator.api;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Component;

import nl.cada.navigator.api.dto.ApplicationPayload;
import nl.cada.navigator.domain.ApplicationInput;
import nl.cada.navigator.domain.CadaDomain;
import nl.cada.navigator.domain.CadaService;
import nl.cada.navigator.domain.NiveauBesluit;
import nl.cada.navigator.domain.SupplierCatalogService;

/**
 * Valideert de payload van het toepassingsformulier en berekent het
 * aanbevolen niveau server-side, zodat de beslisboom niet te omzeilen is.
 */
@Component
public class ApplicationInputParser {

    public record ParsedApplication(
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
    }

    private final CadaService cadaService;
    private final SupplierCatalogService supplierCatalog;

    public ApplicationInputParser(CadaService cadaService, SupplierCatalogService supplierCatalog) {
        this.cadaService = cadaService;
        this.supplierCatalog = supplierCatalog;
    }

    public ParsedApplication parse(ApplicationPayload payload) {
        if (payload == null) {
            throw new ValidationException("Ongeldige aanvraag.");
        }

        String name = payload.name() == null ? "" : payload.name().trim();
        if (name.isEmpty()) {
            throw new ValidationException("Geef de toepassing een naam.");
        }

        List<String> dataTypes = filterValid(payload.dataTypes(), CadaDomain.VALID_DATA_TYPES);
        if (dataTypes.isEmpty()) {
            throw new ValidationException("Selecteer minimaal één type data.");
        }

        List<String> regulations = filterValid(payload.regulations(), CadaDomain.VALID_REGULATIONS);
        if (regulations.isEmpty()) {
            throw new ValidationException(
                    "Selecteer de toepasselijke regelgeving (of 'Geen specifieke regelgeving').");
        }

        String impactLevel = payload.impactLevel();
        if (impactLevel == null || !CadaDomain.VALID_IMPACT.contains(impactLevel)) {
            throw new ValidationException("Kies de impact bij een datalek of uitval.");
        }

        boolean criticalInfra = Boolean.TRUE.equals(payload.criticalInfra());
        boolean aiProcessing = Boolean.TRUE.equals(payload.aiProcessing());

        Set<String> validSuppliers = new HashSet<>(supplierCatalog.catalog().keySet());
        validSuppliers.add(CadaDomain.OTHER_SUPPLIER);
        List<String> suppliers = filterValid(payload.suppliers(), validSuppliers);
        if (suppliers.isEmpty()) {
            throw new ValidationException("Selecteer minimaal één cloudleverancier.");
        }

        String supplierOther = payload.supplierOther() == null ? "" : payload.supplierOther().trim();
        boolean hasOther = suppliers.contains(CadaDomain.OTHER_SUPPLIER);
        if (hasOther && supplierOther.isEmpty()) {
            throw new ValidationException("Vul de naam van de andere leverancier in.");
        }

        NiveauBesluit besluit = cadaService.berekenNiveau(
                new ApplicationInput(dataTypes, regulations, impactLevel, criticalInfra, aiProcessing));

        return new ParsedApplication(name, dataTypes, regulations, impactLevel, criticalInfra, aiProcessing,
                suppliers, hasOther ? supplierOther : "", besluit.level(), besluit.reden());
    }

    private static List<String> filterValid(List<String> values, Set<String> valid) {
        if (values == null) {
            return List.of();
        }
        return values.stream().filter(v -> v != null && valid.contains(v)).toList();
    }
}
