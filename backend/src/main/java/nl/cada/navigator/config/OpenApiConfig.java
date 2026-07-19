package nl.cada.navigator.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;

/**
 * OpenAPI-metadata voor de gegenereerde API-documentatie. De specificatie
 * staat op {@code /v3/api-docs}, de Swagger UI op {@code /swagger-ui.html}.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI cadaOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("CADA Sovereignty Navigator API")
                .version("0.1.0")
                .description("""
                        REST API van de CADA Sovereignty Navigator: dossiers, de \
                        beslisboom en leverancierstoets, gap-rapporten, register-import, \
                        momentopnames, alleen-lezen deellinks en magic-link-authenticatie. \
                        Alle endpoints vereisen een sessiecookie, behalve /api/auth/**, \
                        /api/share/** en /api/meta.""")
                .license(new License().name("Indicatief instrument — geen juridisch advies")));
    }
}
