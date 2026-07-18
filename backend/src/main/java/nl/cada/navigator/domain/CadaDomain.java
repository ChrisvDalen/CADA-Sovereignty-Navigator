package nl.cada.navigator.domain;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Referentiedata voor de CADA Sovereignty Navigator: vragenlijst-opties,
 * leveranciersdataset en niveaubeschrijvingen.
 */
public final class CadaDomain {

    private CadaDomain() {
    }

    public record DataType(String key, String label, String hint) {
    }

    public record Regulation(String key, String label) {
    }

    public record ImpactLevel(String key, String label, String description, int weight) {
    }

    public record SupplierInfo(int maxLevel, String notes) {
    }

    public record LevelInfo(String name, String title, String description, List<String> requirements) {
    }

    public static final List<DataType> DATA_TYPES = List.of(
            new DataType("persoonsgegevens", "Persoonsgegevens (AVG)",
                    "Namen, adressen, BSN's of andere herleidbare gegevens van burgers of medewerkers."),
            new DataType("bijzondere_persoonsgegevens", "Bijzondere persoonsgegevens",
                    "Gezondheid, religie, etniciteit, politieke voorkeur of andere gevoelige categorieën."),
            new DataType("vertrouwelijk_overheid", "Vertrouwelijke overheidsinformatie",
                    "Gerubriceerde informatie (Departementaal Vertrouwelijk of hoger)."),
            new DataType("staatsgeheimen", "Staatsgeheimen",
                    "Informatie gerubriceerd als staatsgeheim (Stg. Confidentieel of hoger)."),
            new DataType("financiele_transacties", "Financiële transactiedata",
                    "Betalingen, subsidies, aanslagen of andere financiële verwerkingen."),
            new DataType("operationeel", "Operationele / procesdata (niet-gevoelig)",
                    "Logistieke, technische of procesgegevens zonder gevoelige inhoud."));

    public static final List<Regulation> REGULATIONS = List.of(
            new Regulation("avg", "AVG / GDPR"),
            new Regulation("bio", "BIO (Baseline Informatiebeveiliging Overheid)"),
            new Regulation("nis2", "NIS2"),
            new Regulation("bir", "BIR (Besluit Informatiebeveiliging Rijksdienst)"),
            new Regulation("wbni", "Wbni"),
            new Regulation("geen", "Geen specifieke regelgeving"));

    public static final List<ImpactLevel> IMPACT_LEVELS = List.of(
            new ImpactLevel("minimaal", "Minimaal", "Geen directe schade bij een datalek of uitval.", 0),
            new ImpactLevel("beperkt", "Beperkt", "Schade is intern herstelbaar, zonder externe gevolgen.", 1),
            new ImpactLevel("ernstig", "Ernstig", "Reputatieschade of boetes zijn mogelijk.", 2),
            new ImpactLevel("kritiek", "Kritiek", "Maatschappelijke ontwrichting of veiligheidsrisico.", 3));

    public static final String OTHER_SUPPLIER = "Anders";

    /** Volgorde van de leveranciers zoals getoond in de vragenlijst. */
    public static final List<String> KNOWN_SUPPLIERS = List.of(
            "AWS (Amazon)",
            "Microsoft Azure",
            "Google Cloud",
            "IBM Cloud",
            "Oracle Cloud",
            "KPN Cloud / Intermax",
            "Cloudferro",
            "SURF",
            "OVHcloud");

    public static final Map<String, SupplierInfo> SUPPLIER_DATA = Map.of(
            "AWS (Amazon)", new SupplierInfo(1,
                    "Valt onder de US Cloud Act. Kan niet voldoen aan niveau 2 of hoger vanwege de Amerikaanse moedermaatschappij."),
            "Microsoft Azure", new SupplierInfo(1,
                    "Valt onder de US Cloud Act en FISA 702. Europese datacenters voldoen aan niveau 1, maar niet aan niveau 2 of hoger."),
            "Google Cloud", new SupplierInfo(1,
                    "Zelfde situatie als AWS en Azure — de Amerikaanse jurisdictie is doorslaggevend."),
            "IBM Cloud", new SupplierInfo(2,
                    "Deels onafhankelijke Europese entiteit mogelijk, afhankelijk van de contractstructuur. De moedermaatschappij is gevestigd in de VS."),
            "Oracle Cloud", new SupplierInfo(1,
                    "Amerikaanse moedermaatschappij, dezelfde restricties als AWS en Azure."),
            "KPN Cloud / Intermax", new SupplierInfo(3,
                    "Nederlands eigendom, geen niet-EU moedermaatschappij."),
            "Cloudferro", new SupplierInfo(3,
                    "Europees eigendom, gespecialiseerd in soevereine cloud voor de overheid."),
            "SURF", new SupplierInfo(4,
                    "Coöperatie van Nederlandse onderwijsinstellingen. Mogelijke niveau 4-kandidaat."),
            "OVHcloud", new SupplierInfo(3,
                    "Frans eigendom, Europese entiteit, voldoet aan de niveau 3-criteria."));

    public static final Map<Integer, LevelInfo> LEVEL_INFO = Map.of(
            1, new LevelInfo("Locatie", "Niveau 1 — Locatie",
                    "De data staat fysiek op Europees grondgebied. Dit is het basisniveau voor al het cloudgebruik door overheidsinstanties.",
                    List.of(
                            "Alle data wordt opgeslagen en verwerkt in datacenters binnen de EU/EER.",
                            "De aanbieder kan de fysieke locatie van de data contractueel garanderen.")),
            2, new LevelInfo("Onafhankelijkheid", "Niveau 2 — Onafhankelijkheid",
                    "De aanbieder is juridisch onafhankelijk van niet-EU-landen en biedt volledige transparantie over de softwarestack.",
                    List.of(
                            "Geen juridische verplichtingen richting niet-EU-overheden (zoals de US Cloud Act of FISA 702).",
                            "Volledige transparantie over de gebruikte softwarestack en toeleveringsketen.",
                            "Alle eisen van niveau 1.")),
            3, new LevelInfo("EU-controle", "Niveau 3 — EU-controle",
                    "De aanbieder is Europees eigendom en staat onder Europees bestuur. Zeggenschap ligt volledig binnen de EU.",
                    List.of(
                            "Meerderheidsbelang en feitelijke zeggenschap in Europese handen.",
                            "Bestuur en toezicht gevestigd binnen de EU.",
                            "Alle eisen van niveau 1 en 2.")),
            4, new LevelInfo("Soevereiniteit", "Niveau 4 — Soevereiniteit",
                    "Volledige EU Sovereign-certificering via ENISA, met een jaarlijkse onafhankelijke audit. Het hoogste beschermingsniveau, bedoeld voor staatsgeheimen en kritieke infrastructuur.",
                    List.of(
                            "Geldige EU Sovereign-certificering, afgegeven via ENISA.",
                            "Jaarlijkse onafhankelijke audit op de certificeringseisen.",
                            "Alle eisen van niveau 1, 2 en 3.")));

    public static final Set<String> VALID_DATA_TYPES =
            Set.copyOf(DATA_TYPES.stream().map(DataType::key).toList());

    public static final Set<String> VALID_REGULATIONS =
            Set.copyOf(REGULATIONS.stream().map(Regulation::key).toList());

    public static final Set<String> VALID_IMPACT =
            Set.copyOf(IMPACT_LEVELS.stream().map(ImpactLevel::key).toList());

    public static int impactWeight(String impactKey) {
        return IMPACT_LEVELS.stream()
                .filter(i -> i.key().equals(impactKey))
                .mapToInt(ImpactLevel::weight)
                .findFirst()
                .orElse(0);
    }

    public static String impactLabel(String impactKey) {
        return IMPACT_LEVELS.stream()
                .filter(i -> i.key().equals(impactKey))
                .map(ImpactLevel::label)
                .findFirst()
                .orElse(impactKey);
    }
}
