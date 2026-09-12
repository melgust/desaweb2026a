package com.example.catalog.support;

import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Shared PostgreSQL Testcontainer for repository and integration tests.
 *
 * <p>PostgreSQL is used for every persistence test - H2 is never used. The
 * {@link ServiceConnection} annotation wires the datasource automatically.</p>
 *
 * <p>Uses Testcontainers 2.x: {@code PostgreSQLContainer} lives in
 * {@code org.testcontainers.postgresql} and no longer uses generics.</p>
 */
@Testcontainers
public abstract class AbstractPostgresIntegrationTest {

    @Container
    @ServiceConnection
    protected static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer("postgres:18-alpine")
                    .withDatabaseName("catalog")
                    .withUsername("catalog")
                    .withPassword("catalog");

    @DynamicPropertySource
    static void enableFlyway(DynamicPropertyRegistry registry) {
        registry.add("spring.flyway.enabled", () -> true);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
    }
}
