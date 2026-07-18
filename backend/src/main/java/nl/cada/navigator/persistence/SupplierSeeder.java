package nl.cada.navigator.persistence;

import java.time.LocalDate;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Vult de leveranciersreferentiedata eenmalig wanneer de tabel leeg is.
 * Daarna is de dataset beheerbaar via /api/suppliers (geen redeploy nodig).
 */
@Component
public class SupplierSeeder implements CommandLineRunner {

    private record Seed(String name, int maxLevel, String jurisdiction, String ownership,
            String certifications, String notes) {
    }

    private static final LocalDate VERIFIED = LocalDate.of(2026, 7, 1);

    private static final List<Seed> SEEDS = List.of(
            new Seed("AWS (Amazon)", 1, "VS (US Cloud Act, FISA 702)", "Amazon.com Inc. (VS)",
                    "ISO 27001, C5, SOC 2",
                    "Valt onder de US Cloud Act. Kan niet voldoen aan niveau 2 of hoger vanwege de Amerikaanse moedermaatschappij."),
            new Seed("Microsoft Azure", 1, "VS (US Cloud Act, FISA 702)", "Microsoft Corporation (VS)",
                    "ISO 27001, C5, SOC 2",
                    "Valt onder de US Cloud Act en FISA 702. Europese datacenters voldoen aan niveau 1, maar niet aan niveau 2 of hoger."),
            new Seed("Google Cloud", 1, "VS (US Cloud Act, FISA 702)", "Alphabet Inc. (VS)",
                    "ISO 27001, C5, SOC 2",
                    "Zelfde situatie als AWS en Azure — de Amerikaanse jurisdictie is doorslaggevend."),
            new Seed("IBM Cloud", 2, "VS, deels EU-entiteiten", "IBM Corporation (VS)",
                    "ISO 27001, C5",
                    "Deels onafhankelijke Europese entiteit mogelijk, afhankelijk van de contractstructuur. De moedermaatschappij is gevestigd in de VS."),
            new Seed("Oracle Cloud", 1, "VS (US Cloud Act)", "Oracle Corporation (VS)",
                    "ISO 27001, SOC 2",
                    "Amerikaanse moedermaatschappij, dezelfde restricties als AWS en Azure."),
            new Seed("KPN Cloud / Intermax", 3, "Nederland", "KPN N.V. (NL)",
                    "ISO 27001, NEN 7510, BIO-conform",
                    "Nederlands eigendom, geen niet-EU moedermaatschappij."),
            new Seed("Cloudferro", 3, "Polen / EU", "Europese aandeelhouders",
                    "ISO 27001",
                    "Europees eigendom, gespecialiseerd in soevereine cloud voor de overheid."),
            new Seed("SURF", 4, "Nederland", "Coöperatie van Nederlandse onderwijs- en onderzoeksinstellingen",
                    "ISO 27001, NEN 7510",
                    "Coöperatie van Nederlandse onderwijsinstellingen. Mogelijke niveau 4-kandidaat."),
            new Seed("OVHcloud", 3, "Frankrijk", "OVH Groupe SAS (FR)",
                    "ISO 27001, SecNumCloud, HDS",
                    "Frans eigendom, Europese entiteit, voldoet aan de niveau 3-criteria."),
            new Seed("Scaleway", 3, "Frankrijk", "Iliad Group (FR)",
                    "ISO 27001, HDS",
                    "Frans eigendom met eigen datacenters in de EU."),
            new Seed("Hetzner", 3, "Duitsland", "Hetzner Online GmbH (DE, familiebedrijf)",
                    "ISO 27001",
                    "Duits familiebedrijf met datacenters in Duitsland en Finland."),
            new Seed("Exoscale", 2, "Zwitserland / Oostenrijk", "A1 Group (AT); uiteindelijke zeggenschap deels buiten de EU",
                    "ISO 27001",
                    "Onderdeel van A1 Group; toets de uiteindelijke zeggenschapsstructuur voordat niveau 3 wordt geclaimd."),
            new Seed("Leaseweb", 3, "Nederland", "Leaseweb Global B.V. (NL)",
                    "ISO 27001",
                    "Nederlands eigendom met wereldwijde datacenters; EU-regio's contractueel afdwingbaar."),
            new Seed("T-Systems / Open Telekom Cloud", 3, "Duitsland", "Deutsche Telekom AG (DE)",
                    "ISO 27001, C5",
                    "Duits eigendom. Vraag transparantie over de gebruikte softwarestack in de toeleveringsketen."),
            new Seed("Fuga Cloud", 3, "Nederland", "Cyso Group (NL)",
                    "ISO 27001",
                    "Nederlands eigendom, OpenStack-gebaseerd met transparante stack."),
            new Seed("TransIP / team.blue", 2, "Nederland / België", "team.blue (BE) met niet-EU-investeerders",
                    "ISO 27001",
                    "Europese entiteit met deels niet-EU-investeerders; toets de zeggenschapsstructuur voor niveau 3."),
            new Seed("StackIT", 3, "Duitsland", "Schwarz Gruppe (DE)",
                    "ISO 27001, C5",
                    "Duits eigendom (Schwarz Gruppe); positioneert zich als soevereine cloud en is niveau 4-kandidaat zodra de ENISA-certificering rond is."),
            new Seed("Elastx", 3, "Zweden", "Zweeds eigendom",
                    "ISO 27001",
                    "Zweedse aanbieder met datacenters in Zweden."));

    private final SupplierRepository suppliers;

    public SupplierSeeder(SupplierRepository suppliers) {
        this.suppliers = suppliers;
    }

    @Override
    public void run(String... args) {
        if (suppliers.count() > 0) {
            return;
        }
        int position = 0;
        for (Seed seed : SEEDS) {
            SupplierEntity entity = new SupplierEntity();
            entity.setName(seed.name());
            entity.setMaxLevel(seed.maxLevel());
            entity.setJurisdiction(seed.jurisdiction());
            entity.setOwnership(seed.ownership());
            entity.setCertifications(seed.certifications());
            entity.setNotes(seed.notes());
            entity.setLastVerified(VERIFIED);
            entity.setPosition(position++);
            suppliers.save(entity);
        }
    }
}
