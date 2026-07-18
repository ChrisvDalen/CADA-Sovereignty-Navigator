package nl.cada.navigator.domain;

/** Uitkomst van de beslisboom: het niveau plus de regel die dat bepaalde. */
public record NiveauBesluit(int level, String reden) {
}
