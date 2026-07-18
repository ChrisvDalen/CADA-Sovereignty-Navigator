package nl.cada.navigator.domain;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import nl.cada.navigator.domain.CadaDomain.SupplierInfo;
import nl.cada.navigator.persistence.SupplierEntity;
import nl.cada.navigator.persistence.SupplierRepository;

/** Levert de leveranciersreferentiedata uit de database aan de domeinlogica. */
@Service
public class SupplierCatalogService {

    private final SupplierRepository suppliers;

    public SupplierCatalogService(SupplierRepository suppliers) {
        this.suppliers = suppliers;
    }

    @Transactional(readOnly = true)
    public List<SupplierEntity> all() {
        return suppliers.findAllByOrderByPositionAsc();
    }

    /** Naam → niveau/toelichting, in beheerde volgorde. */
    @Transactional(readOnly = true)
    public Map<String, SupplierInfo> catalog() {
        Map<String, SupplierInfo> catalog = new LinkedHashMap<>();
        for (SupplierEntity supplier : all()) {
            catalog.put(supplier.getName(), new SupplierInfo(supplier.getMaxLevel(), supplier.getNotes()));
        }
        return catalog;
    }
}
