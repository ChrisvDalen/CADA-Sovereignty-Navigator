package nl.cada.navigator.api;

/** Invoerfout met een gebruikersgerichte (Nederlandstalige) melding. */
public class ValidationException extends RuntimeException {

    public ValidationException(String message) {
        super(message);
    }
}
