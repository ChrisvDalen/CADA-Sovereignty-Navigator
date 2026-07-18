package nl.cada.navigator.domain;

import java.util.List;

/** Antwoorden uit het toepassingsprofiel die het niveau bepalen. */
public record ApplicationInput(
        List<String> dataTypes,
        List<String> regulations,
        String impactLevel,
        boolean criticalInfra,
        boolean aiProcessing) {
}
