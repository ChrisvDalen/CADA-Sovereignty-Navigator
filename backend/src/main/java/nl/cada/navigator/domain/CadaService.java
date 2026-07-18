package nl.cada.navigator.domain;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import nl.cada.navigator.domain.CadaDomain.SupplierInfo;
import nl.cada.navigator.domain.ComplianceResult.SupplierCheckResult;

/**
 * Beslisboom, leverancierstoets en aanbevelingen — de kern van de navigator.
 * De leveranciersreferentiedata komt uit de database en wordt als catalogus
 * (naam → {@link SupplierInfo}) meegegeven, zodat deze logica puur blijft.
 */
@Service
public class CadaService {

    /**
     * Deterministische beslisboom voor het aanbevolen CADA-niveau. Elke
     * uitkomst draagt de regel die hem bepaalde, zodat de niveaubepaling
     * uitlegbaar en auditeerbaar is.
     *
     * 1. Staatsgeheimen                                                  → niveau 4
     * 2. Kritieke infrastructuur met kritieke impact                     → niveau 4
     * 3. Vertrouwelijke overheidsinformatie                              → niveau 3
     * 4. Bijzondere persoonsgegevens met ernstige/kritieke impact        → niveau 3
     * 5. AI-verwerking van bijzondere persoonsgegevens                   → niveau 3
     * 6. Persoonsgegevens onder BIO/NIS2/BIR met ernstige/kritieke impact → niveau 2
     * 7. AI-verwerking van persoonsgegevens                              → niveau 2
     * 8. Alle overige gevallen                                            → niveau 1
     */
    public NiveauBesluit berekenNiveau(ApplicationInput input) {
        Set<String> data = new HashSet<>(input.dataTypes());
        Set<String> regs = new HashSet<>(input.regulations());
        boolean zwareImpact = "ernstig".equals(input.impactLevel()) || "kritiek".equals(input.impactLevel());

        if (data.contains("staatsgeheimen")) {
            return new NiveauBesluit(4, "De toepassing verwerkt staatsgeheimen.");
        }
        if (input.criticalInfra() && "kritiek".equals(input.impactLevel())) {
            return new NiveauBesluit(4,
                    "De toepassing is onderdeel van kritieke infrastructuur en heeft kritieke impact bij uitval.");
        }

        if (data.contains("vertrouwelijk_overheid")) {
            return new NiveauBesluit(3, "De toepassing verwerkt vertrouwelijke overheidsinformatie.");
        }
        if (data.contains("bijzondere_persoonsgegevens") && zwareImpact) {
            return new NiveauBesluit(3,
                    "De toepassing verwerkt bijzondere persoonsgegevens met ernstige of kritieke impact.");
        }
        if (input.aiProcessing() && data.contains("bijzondere_persoonsgegevens")) {
            return new NiveauBesluit(3, "De toepassing past AI-verwerking toe op bijzondere persoonsgegevens.");
        }

        if (data.contains("persoonsgegevens")
                && (regs.contains("bio") || regs.contains("nis2") || regs.contains("bir"))
                && zwareImpact) {
            return new NiveauBesluit(2,
                    "De toepassing verwerkt persoonsgegevens onder BIO, NIS2 of BIR met ernstige of kritieke impact.");
        }
        if (input.aiProcessing() && data.contains("persoonsgegevens")) {
            return new NiveauBesluit(2, "De toepassing past AI-verwerking toe op persoonsgegevens.");
        }

        return new NiveauBesluit(1, "Geen verzwarende factoren; het basisniveau (datalocatie in de EU) volstaat.");
    }

    public ComplianceResult checkCompliance(List<String> suppliers, int recommendedLevel,
            Map<String, SupplierInfo> catalog) {
        List<SupplierCheckResult> results = suppliers.stream()
                .map(name -> {
                    SupplierInfo info = catalog.get(name);
                    if (info == null) {
                        return new SupplierCheckResult(name, false, null, "", null);
                    }
                    return new SupplierCheckResult(name, true, info.maxLevel(), info.notes(),
                            info.maxLevel() >= recommendedLevel);
                })
                .toList();

        List<SupplierCheckResult> known = results.stream().filter(SupplierCheckResult::known).toList();
        if (known.isEmpty()) {
            return new ComplianceResult(results, null, "unknown", 0);
        }

        // Elke leverancier die data van de toepassing verwerkt moet aan het
        // aanbevolen niveau voldoen; het zwakste niveau bepaalt dus de status.
        int weakest = known.stream().mapToInt(SupplierCheckResult::maxLevel).min().orElseThrow();
        int gap = Math.max(0, recommendedLevel - weakest);
        boolean allKnownCompliant = known.stream().allMatch(r -> Boolean.TRUE.equals(r.compliant()));
        boolean hasUnknown = results.stream().anyMatch(r -> !r.known());

        String status = gap > 0 ? "gap" : allKnownCompliant && hasUnknown ? "unknown" : "ok";
        return new ComplianceResult(results, weakest, status, gap);
    }

    /** Leveranciers uit de catalogus die minimaal het gevraagde niveau halen. */
    public List<String> suppliersForLevel(int level, Map<String, SupplierInfo> catalog) {
        return catalog.entrySet().stream()
                .filter(e -> e.getValue().maxLevel() >= level)
                .map(Map.Entry::getKey)
                .toList();
    }

    public List<String> buildRecommendation(String appName, int recommendedLevel, ComplianceResult compliance,
            Map<String, SupplierInfo> catalog) {
        List<String> adviezen = new ArrayList<>();

        if ("ok".equals(compliance.status())) {
            adviezen.add(("De huidige leverancierskeuze is verenigbaar met niveau %d. Leg de niveaubepaling en de "
                    + "contractuele garanties vast in het risicodossier van \"%s\".")
                    .formatted(recommendedLevel, appName));
            if (recommendedLevel == 4) {
                adviezen.add("Controleer of de leverancier daadwerkelijk over een geldige EU Sovereign-certificering "
                        + "(ENISA) beschikt en plan de jaarlijkse audit in.");
            }
            return adviezen;
        }

        if ("unknown".equals(compliance.status())) {
            adviezen.add(("Eén of meer leveranciers zijn niet in de referentiedataset opgenomen. Toets deze "
                    + "leverancier(s) handmatig aan de criteria van niveau %d (jurisdictie, eigendomsstructuur "
                    + "en certificering).").formatted(recommendedLevel));
            return adviezen;
        }

        List<String> kandidaten = suppliersForLevel(recommendedLevel, catalog);
        String nietCompliant = compliance.suppliers().stream()
                .filter(s -> Boolean.FALSE.equals(s.compliant()))
                .map(SupplierCheckResult::name)
                .collect(Collectors.joining(" en "));

        if (!kandidaten.isEmpty()) {
            adviezen.add("Overweeg migratie van %s naar een leverancier die niveau %d haalt, zoals %s."
                    .formatted(nietCompliant, recommendedLevel, String.join(", ", kandidaten)));
        } else {
            adviezen.add(("Er is in de referentiedataset geen leverancier die niveau %d volledig haalt. "
                    + "Start een marktverkenning naar aanbieders met een EU Sovereign-certificering.")
                    .formatted(recommendedLevel));
        }

        if (compliance.gap() == 1 && recommendedLevel == 2) {
            adviezen.add("Als alternatief: pas de contractstructuur met de huidige leverancier aan, zodat een "
                    + "juridisch onafhankelijke Europese entiteit de dienst levert. Laat dit juridisch toetsen.");
        }

        if (recommendedLevel >= 3) {
            adviezen.add("Neem de migratie op in de meerjarige cloudstrategie en reserveer budget: een overstap op "
                    + "dit niveau raakt doorgaans ook architectuur en beheerprocessen.");
        }

        if (recommendedLevel == 4) {
            adviezen.add("Niveau 4 vereist een EU Sovereign-certificering via ENISA met jaarlijkse audit. "
                    + "Verifieer de certificeringsstatus van de beoogde leverancier vóór contractering.");
        }

        return adviezen;
    }

    /** Prioriteitsscore voor de roadmap: hoogste impact + grootste gap bovenaan. */
    public int priorityScore(String impactKey, int gap) {
        return CadaDomain.impactWeight(impactKey) * 10 + gap;
    }
}
