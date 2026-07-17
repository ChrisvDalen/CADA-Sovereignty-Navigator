package nl.cada.navigator.api;

import java.util.List;
import nl.cada.navigator.api.ApiDtos.ApplicationRequest;
import nl.cada.navigator.domain.Cada;

/**
 * Valideert de payload van het toepassingsformulier en berekent het aanbevolen
 * niveau server-side, zodat de beslisboom niet te omzeilen is.
 */
public final class ApplicationValidator {

    private ApplicationValidator() {
    }

    public record ValidatedApplication(
            String name,
            List<String> dataTypes,
            List<String> regulations,
            String impactLevel,
            boolean criticalInfra,
            List<String> suppliers,
            String supplierOther,
            int recommendedLevel) {
    }

    public static ValidatedApplication validate(ApplicationRequest request) {
        if (request == null) {
            throw new InvalidPayloadException("Ongeldige aanvraag.");
        }

        var name = request.name() == null ? "" : request.name().trim();
        if (name.isEmpty()) {
            throw new InvalidPayloadException("Geef de toepassing een naam.");
        }

        var dataTypes = filterKnown(request.dataTypes(), Cada.DATA_TYPES);
        if (dataTypes.isEmpty()) {
            throw new InvalidPayloadException("Selecteer minimaal één type data.");
        }

        var regulations = filterKnown(request.regulations(), Cada.REGULATIONS);
        if (regulations.isEmpty()) {
            throw new InvalidPayloadException(
                    "Selecteer de toepasselijke regelgeving (of 'Geen specifieke regelgeving').");
        }

        var impactLevel = request.impactLevel();
        if (impactLevel == null || !Cada.IMPACT_LEVELS.contains(impactLevel)) {
            throw new InvalidPayloadException("Kies de impact bij een datalek of uitval.");
        }

        var criticalInfra = Boolean.TRUE.equals(request.criticalInfra());

        var suppliers = filterKnown(request.suppliers(), Cada.SUPPLIERS);
        if (suppliers.isEmpty()) {
            throw new InvalidPayloadException("Selecteer minimaal één cloudleverancier.");
        }

        var supplierOther = request.supplierOther() == null ? "" : request.supplierOther().trim();
        var other = suppliers.contains(Cada.OTHER_SUPPLIER);
        if (other && supplierOther.isEmpty()) {
            throw new InvalidPayloadException("Vul de naam van de andere leverancier in.");
        }

        var recommendedLevel = Cada.berekenNiveau(dataTypes, regulations, impactLevel, criticalInfra);

        return new ValidatedApplication(
                name,
                dataTypes,
                regulations,
                impactLevel,
                criticalInfra,
                suppliers,
                other ? supplierOther : "",
                recommendedLevel);
    }

    private static List<String> filterKnown(List<String> values, java.util.Set<String> valid) {
        return values == null ? List.of() : values.stream().filter(valid::contains).distinct().toList();
    }
}
