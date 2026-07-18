package nl.cada.navigator.api.dto;

import java.util.List;

/** Ruwe payload van het toepassingsformulier, vóór validatie. */
public record ApplicationPayload(
        String name,
        List<String> dataTypes,
        List<String> regulations,
        String impactLevel,
        Boolean criticalInfra,
        List<String> suppliers,
        String supplierOther) {
}
