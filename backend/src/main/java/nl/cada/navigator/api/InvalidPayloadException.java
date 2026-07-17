package nl.cada.navigator.api;

/** Ongeldige invoer van het formulier; wordt vertaald naar een 400-respons. */
public class InvalidPayloadException extends RuntimeException {

    public InvalidPayloadException(String message) {
        super(message);
    }
}
