package nl.cada.navigator.api;

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

/** Referentiedata en de live niveau-indicatie voor de frontend. */
@RestController
@RequestMapping("/api")
public class MetaController {

    private final CadaService cadaService;

    public MetaController(CadaService cadaService) {
        this.cadaService = cadaService;
    }

    public record MetaResponse(
            List<CadaDomain.DataType> dataTypes,
            List<CadaDomain.Regulation> regulations,
            List<CadaDomain.ImpactLevel> impactLevels,
            List<String> knownSuppliers,
            String otherSupplier,
            Map<String, CadaDomain.SupplierInfo> supplierData,
            Map<Integer, CadaDomain.LevelInfo> levelInfo) {
    }

    @GetMapping("/meta")
    public MetaResponse meta() {
        return new MetaResponse(
                CadaDomain.DATA_TYPES,
                CadaDomain.REGULATIONS,
                CadaDomain.IMPACT_LEVELS,
                CadaDomain.KNOWN_SUPPLIERS,
                CadaDomain.OTHER_SUPPLIER,
                CadaDomain.SUPPLIER_DATA,
                CadaDomain.LEVEL_INFO);
    }

    public record LevelPreviewPayload(
            List<String> dataTypes,
            List<String> regulations,
            String impactLevel,
            Boolean criticalInfra) {
    }

    public record LevelPreviewResponse(int level) {
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
        int level = cadaService.berekenNiveau(new ApplicationInput(
                dataTypes, regulations, impact, Boolean.TRUE.equals(payload.criticalInfra())));
        return new LevelPreviewResponse(level);
    }
}
