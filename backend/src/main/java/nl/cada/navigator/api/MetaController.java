package nl.cada.navigator.api;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import nl.cada.navigator.domain.ApplicationInput;
import nl.cada.navigator.domain.CadaDomain;
import nl.cada.navigator.domain.CadaService;
import nl.cada.navigator.domain.NiveauBesluit;
import nl.cada.navigator.domain.SupplierCatalogService;

/** Referentiedata en de live niveau-indicatie voor de frontend. */
@RestController
@RequestMapping("/api")
public class MetaController {

    private final CadaService cadaService;
    private final SupplierCatalogService supplierCatalog;

    public MetaController(CadaService cadaService, SupplierCatalogService supplierCatalog) {
        this.cadaService = cadaService;
        this.supplierCatalog = supplierCatalog;
    }

    public record SupplierDetail(
            String id,
            String name,
            int maxLevel,
            String notes,
            String jurisdiction,
            String ownership,
            String certifications,
            LocalDate lastVerified) {
    }

    public record MetaResponse(
            List<CadaDomain.DataType> dataTypes,
            List<CadaDomain.Regulation> regulations,
            List<CadaDomain.ImpactLevel> impactLevels,
            List<String> knownSuppliers,
            String otherSupplier,
            Map<String, CadaDomain.SupplierInfo> supplierData,
            List<SupplierDetail> supplierDetails,
            Map<Integer, CadaDomain.LevelInfo> levelInfo) {
    }

    @GetMapping("/meta")
    public MetaResponse meta() {
        List<SupplierDetail> details = supplierCatalog.all().stream()
                .map(s -> new SupplierDetail(s.getId(), s.getName(), s.getMaxLevel(), s.getNotes(),
                        s.getJurisdiction(), s.getOwnership(), s.getCertifications(), s.getLastVerified()))
                .toList();
        return new MetaResponse(
                CadaDomain.DATA_TYPES,
                CadaDomain.REGULATIONS,
                CadaDomain.IMPACT_LEVELS,
                details.stream().map(SupplierDetail::name).toList(),
                CadaDomain.OTHER_SUPPLIER,
                supplierCatalog.catalog(),
                details,
                CadaDomain.LEVEL_INFO);
    }

    public record LevelPreviewPayload(
            List<String> dataTypes,
            List<String> regulations,
            String impactLevel,
            Boolean criticalInfra,
            Boolean aiProcessing) {
    }

    public record LevelPreviewResponse(int level, String reden) {
    }

    /**
     * Voorlopige niveau-indicatie tijdens het invullen van het formulier.
     * Vereist minimaal één datatype en een impactkeuze; de definitieve
     * berekening gebeurt bij het opslaan.
     */
    @PostMapping("/level-preview")
    public LevelPreviewResponse preview(@RequestBody LevelPreviewPayload payload) {
        List<String> dataTypes = payload.dataTypes() == null ? List.of() : payload.dataTypes();
        List<String> regulations = payload.regulations() == null ? List.of() : payload.regulations();
        String impact = payload.impactLevel();
        if (dataTypes.isEmpty() || impact == null || !CadaDomain.VALID_IMPACT.contains(impact)) {
            throw new ValidationException("Beantwoord eerst de vragen over data en impact.");
        }
        NiveauBesluit besluit = cadaService.berekenNiveau(new ApplicationInput(
                dataTypes, regulations, impact,
                Boolean.TRUE.equals(payload.criticalInfra()),
                Boolean.TRUE.equals(payload.aiProcessing())));
        return new LevelPreviewResponse(besluit.level(), besluit.reden());
    }
}
