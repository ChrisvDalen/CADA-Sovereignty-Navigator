package nl.cada.navigator.api;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Component;

import nl.cada.navigator.api.dto.ApplicationPayload;
import nl.cada.navigator.domain.ApplicationInput;
import nl.cada.navigator.domain.CadaDomain;
import nl.cada.navigator.domain.CadaService;

/**
 * Valideert de payload van het toepassingsformulier en berekent het
 * aanbevolen niveau server-side, zodat de beslisboom niet te omzeilen is.
 */
@Component
public class ApplicationInputParser {

    private static final Set<String> VALID_SUPPLIERS;

    static {
        Set<String> suppliers = new HashSet<>(CadaDomain.KNOWN_SUPPLIERS);
        suppliers.add(CadaDomain.OTHER_SUPPLIER);
        VALID_SUPPLIERS = Set.copyOf(suppliers);
    }

    public record ParsedApplication(
            String name,
            List<String> dataTypes,
            List<String> regulations,
            String impactLevel,
            boolean criticalInfra,
            List<String> suppliers,
            String supplierOther,
            int recommendedLevel) {
    }

    private final CadaService cadaService;

    public ApplicationInputParser(CadaService cadaService) {
        this.cadaService = cadaService;
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

        List<String> suppliers = filterValid(payload.suppliers(), VALID_SUPPLIERS);
        if (suppliers.isEmpty()) {
            throw new ValidationException("Selecteer minimaal één cloudleverancier.");
        }

        String supplierOther = payload.supplierOther() == null ? "" : payload.supplierOther().trim();
        boolean hasOther = suppliers.contains(CadaDomain.OTHER_SUPPLIER);
        if (hasOther && supplierOther.isEmpty()) {
            throw new ValidationException("Vul de naam van de andere leverancier in.");
        }

        int recommendedLevel = cadaService.berekenNiveau(
                new ApplicationInput(dataTypes, regulations, impactLevel, criticalInfra));

        return new ParsedApplication(name, dataTypes, regulations, impactLevel, criticalInfra,
                suppliers, hasOther ? supplierOther : "", recommendedLevel);
    }

    private static List<String> filterValid(List<String> values, Set<String> valid) {
        if (values == null) {
            return List.of();
        }
        return values.stream().filter(v -> v != null && valid.contains(v)).toList();
    }
}
