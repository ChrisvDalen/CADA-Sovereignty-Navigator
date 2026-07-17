package nl.cada.navigator.domain;

import java.util.List;
import java.util.Set;

/**
 * Domeinlogica van de CADA Sovereignty Navigator: geldige antwoordopties en de
 * deterministische beslisboom voor het aanbevolen soevereiniteitsniveau.
 * De beslisboom draait server-side zodat hij niet te omzeilen is.
 */
public final class Cada {

    private Cada() {
    }

    public static final Set<String> DATA_TYPES = Set.of(
            "persoonsgegevens",
            "bijzondere_persoonsgegevens",
            "vertrouwelijk_overheid",
            "staatsgeheimen",
            "financiele_transacties",
            "operationeel");

    public static final Set<String> REGULATIONS = Set.of("avg", "bio", "nis2", "bir", "wbni", "geen");

    public static final Set<String> IMPACT_LEVELS = Set.of("minimaal", "beperkt", "ernstig", "kritiek");

    public static final String OTHER_SUPPLIER = "Anders";

    public static final Set<String> SUPPLIERS = Set.of(
            "AWS (Amazon)",
            "Microsoft Azure",
            "Google Cloud",
            "IBM Cloud",
            "Oracle Cloud",
            "KPN Cloud / Intermax",
            "Cloudferro",
            "SURF",
            "OVHcloud",
            OTHER_SUPPLIER);

    /**
     * Deterministische beslisboom voor het aanbevolen CADA-niveau.
     *
     * 1. Staatsgeheimen, of kritieke infrastructuur met kritieke impact   → niveau 4
     * 2. Vertrouwelijke overheidsinformatie, of bijzondere persoons-
     *    gegevens met ernstige/kritieke impact                            → niveau 3
     * 3. Persoonsgegevens onder BIO/NIS2/BIR met ernstige/kritieke impact → niveau 2
     * 4. Alle overige gevallen                                            → niveau 1
     */
    public static int berekenNiveau(
            List<String> dataTypes, List<String> regulations, String impactLevel, boolean criticalInfra) {
        var zwareImpact = impactLevel.equals("ernstig") || impactLevel.equals("kritiek");

        if (dataTypes.contains("staatsgeheimen") || (criticalInfra && impactLevel.equals("kritiek"))) {
            return 4;
        }
        if (dataTypes.contains("vertrouwelijk_overheid")
                || (dataTypes.contains("bijzondere_persoonsgegevens") && zwareImpact)) {
            return 3;
        }
        if (dataTypes.contains("persoonsgegevens")
                && (regulations.contains("bio") || regulations.contains("nis2") || regulations.contains("bir"))
                && zwareImpact) {
            return 2;
        }
        return 1;
    }
}
