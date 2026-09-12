package com.example.catalog.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger configuration.
 *
 * <p><strong>Current stage:</strong> the API is completely unauthenticated.
 * No security scheme is registered, so Swagger UI does not present an
 * "Authorize" button and clients can call every endpoint without a token.</p>
 *
 * <p><strong>Future Security (NOT implemented yet):</strong> the service will
 * become an OAuth2 Resource Server validating JWT access tokens issued by an
 * external Identity Provider. Endpoints will be protected by scopes
 * ({@code catalog:read}, {@code catalog:write}, {@code catalog:admin}). When
 * that stage arrives, a {@code bearer-jwt} security scheme will be added here.
 * It is intentionally omitted now so authentication does not appear to be a
 * current requirement.</p>
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI catalogOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Catalog Service API")
                        .description("""
                                Catalog microservice for an online store.

                                CURRENT STATE: Authentication is DISABLED. There is no OAuth2, OIDC, JWT,
                                Identity Provider or API Gateway. All endpoints are directly accessible
                                without an Authorization header.

                                FUTURE SECURITY (not implemented): the service will act as an OAuth2
                                Resource Server validating JWT access tokens, protected by the scopes
                                catalog:read, catalog:write and catalog:admin, behind an API Gateway.
                                """)
                        .version("v1")
                        .contact(new Contact().name("Catalog Team").email("catalog@example.com"))
                        .license(new License().name("Apache 2.0").url("https://www.apache.org/licenses/LICENSE-2.0")));
    }
}
