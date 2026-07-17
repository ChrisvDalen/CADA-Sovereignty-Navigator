package nl.cada.navigator.api;

/** Opgevraagde entiteit bestaat niet; wordt vertaald naar een 404-respons. */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
