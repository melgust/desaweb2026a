# catalog-service

A production-quality **Catalog microservice** for an online store, built with
**Java 25**, **Spring Boot 4.1.x** and **PostgreSQL 18**, following a clean
layered architecture designed to evolve without rewriting business logic.

---

## Current state

```
CURRENT STATE

Authentication:    OFF
OAuth2:            OFF
OIDC:              OFF
JWT:               OFF
Identity Provider: NONE
API Gateway:       NONE
Roles:             NOT ENFORCED
Scopes:            NOT ENFORCED

Architecture:

Client
   |
   v
catalog-service
   |
   v
PostgreSQL
```

Every endpoint is directly reachable **without any `Authorization` header**.

```bash
curl http://localhost:8080/api/v1/products   # works, no token required
```

---

## 1. Project purpose

Provide the catalog capability (products) for an online store as an independent,
testable and extensible microservice. This is the first stage of a larger
system; authentication and an API Gateway are intentionally deferred.

## 2. Current architecture

The client (Postman, frontend, curl) calls the service directly, which talks to
PostgreSQL. There is no gateway and no identity provider.

## 3. Future architecture

```
FUTURE STATE

Client
   |
   v
API Gateway
   |
   v
catalog-service
   |
   v
PostgreSQL

Identity Provider
   |
   +-- OAuth2 / OIDC
   |
   +-- JWT access tokens
```

The code is structured so this evolution requires **no changes to business
logic** — only added security configuration and gateway infrastructure.

## 4. Package structure

```
com.example.catalog
├── CatalogApplication.java        # entry point
├── config/
│   └── OpenApiConfig.java         # OpenAPI/Swagger (no security scheme yet)
├── catalog/
│   ├── controller/                # thin HTTP layer
│   ├── dto/                       # HTTP contract (records)
│   ├── entity/                    # JPA entities + enum
│   ├── mapper/                    # entity <-> DTO conversions
│   ├── repository/                # persistence
│   └── service/                   # business logic + transactions
└── common/
    └── exception/                 # business exceptions + handler
```

## 5. Controller responsibilities

`ProductController` only: receives HTTP requests, validates DTOs, calls the
service, returns DTOs and appropriate status codes. It never touches the
repository, contains no business logic and performs no mapping.

## 6. DTO responsibilities

DTOs define the HTTP contract. Entities are **never** exposed:
- `ProductRequest` — create/update payload with Jakarta Bean Validation.
- `ProductResponse` — full representation for single-resource endpoints.
- `ProductSummaryResponse` — compact representation for list responses.

## 7. Service responsibilities

`ProductService` / `ProductServiceImpl` hold all business rules: SKU/slug
uniqueness, existence checks, transaction boundaries (`@Transactional`),
repository coordination and mapper invocation.

## 8. Repository responsibilities

`ProductRepository` (`JpaRepository` + `JpaSpecificationExecutor`) handles only
persistence, including derived queries (`existsBySku`, `findBySlug`, …) and
dynamic filter specifications.

## 9. Entity responsibilities

`Product` represents persistence/domain state: UUID primary key, optimistic
locking via `@Version`, audit timestamps and `ProductStatus` persisted as text.
No JPA relationships exist at this stage.

## 10. Mapper responsibilities

`ProductMapper` performs explicit conversions:
`ProductRequest -> Product`, `Product -> ProductResponse`,
`Product -> ProductSummaryResponse`. Mapping never happens in controllers.

## 11. PostgreSQL

PostgreSQL 18 is the only datastore. The database contains exactly one business
table: `products`. There are no user, role, permission or auth tables.

## 12. Flyway

Flyway owns the schema via `src/main/resources/db/migration/V1__create_products.sql`.
Hibernate runs with `ddl-auto: validate` and never creates or modifies schema.

## 13. Docker

Multi-stage `Dockerfile`: builds with `maven:3.9-eclipse-temurin-25`, runs on
`eclipse-temurin:25-jre` as a **non-root** user, exposes port `8080` and is
configured entirely through environment variables.

## 14. Docker Compose

`compose.yml` defines exactly two services — `catalog-service` and `postgres`
(18-alpine) — with a persistent volume, a PostgreSQL healthcheck and a
dependency on a healthy database.

```bash
docker compose up --build
```

## 15. Local development

Prerequisites: JDK 25, Maven, Docker.

Start only PostgreSQL and run the app from your IDE/CLI with the `dev` profile:

```bash
docker compose up -d postgres
SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run   # or: mvn spring-boot:run
```

Database configuration is read from environment variables (with local defaults):

```
DATABASE_URL=jdbc:postgresql://localhost:5432/catalog
DATABASE_USERNAME=catalog
DATABASE_PASSWORD=catalog
```

Swagger UI: `http://localhost:8080/swagger-ui.html`
OpenAPI JSON: `http://localhost:8080/v3/api-docs`
Health: `http://localhost:8080/actuator/health`

## 16. Running tests

```bash
mvn test
```

Tests use **PostgreSQL via Testcontainers** (never H2), so a running Docker
daemon is required.

- `ProductServiceTest` — unit tests with Mockito.
- `ProductControllerTest` — `@WebMvcTest` + MockMvc, service mocked, no DB.
- `ProductRepositoryTest` — `@DataJpaTest` against a PostgreSQL container.
- `ProductIntegrationTest` — `@SpringBootTest` full HTTP → DB flow, verifies
  Flyway migrations run and the API works without authentication.

## 17. REST endpoints

| Method | Path                     | Description        | Success |
|--------|--------------------------|--------------------|---------|
| POST   | `/api/v1/products`       | Create product     | 201     |
| GET    | `/api/v1/products`       | List (paged)       | 200     |
| GET    | `/api/v1/products/{id}`  | Get by id          | 200     |
| PUT    | `/api/v1/products/{id}`  | Update product     | 200     |
| DELETE | `/api/v1/products/{id}`  | Delete product     | 204     |

## 18. Pagination

`GET /api/v1/products` uses Spring Data `Pageable`:

```
GET /api/v1/products?page=0&size=20&sort=name,asc
```

List responses use the dedicated `ProductSummaryResponse`; collections are never
returned unbounded.

## 19. Filtering

Optional filters (combinable):

```
GET /api/v1/products?status=ACTIVE
GET /api/v1/products?sku=ABC-123
GET /api/v1/products?search=iphone     # case-insensitive over name/description
```

## 20. Error handling

`GlobalExceptionHandler` (`@RestControllerAdvice`) returns **RFC 9457 Problem
Details** and never exposes stack traces.

| Situation                          | Status |
|------------------------------------|--------|
| Validation error                   | 400    |
| Product not found                  | 404    |
| Duplicate SKU/slug                 | 409    |
| DB integrity violation             | 409    |

Note: `401`/`403` are **not** part of the current API — they belong to the
future security stage.

## 21. Current security state

Authentication is completely disabled: no OAuth2, OIDC, JWT, identity provider,
roles, scopes or API gateway. The service is used directly.

## 22. Future OAuth2/OIDC architecture

The service will later act as an **OAuth2 Resource Server** validating **JWT
access tokens** issued by an external Identity Provider. This will be added via
`SecurityFilterChain` + JWT decoder configuration — the business logic will not
change.

## 23. Future roles and scopes

Scopes represent API permissions; roles represent user profiles.

```
Scopes: catalog:read, catalog:write, catalog:admin

CUSTOMER         -> catalog:read
CATALOG_MANAGER  -> catalog:read, catalog:write
ADMIN            -> catalog:read, catalog:write, catalog:admin
```

None of this is implemented yet.

## 24. Future API Gateway

An API Gateway will later handle routing, global security, rate limiting, CORS
and request correlation. The service will remain independently executable and
must not depend on the gateway.

## 25. How to add future entities

Every new business entity (e.g. `Category`, `Brand`, `ProductImage`) follows the
same pattern:

```
Controller -> DTO -> Service -> Repository -> Entity -> Mapper -> Tests -> Flyway migration
```

1. Add the entity + enum(s) under `catalog/entity`.
2. Add request/response DTOs (records) under `catalog/dto`.
3. Add a mapper under `catalog/mapper`.
4. Add a repository under `catalog/repository`.
5. Add a service interface + impl under `catalog/service`.
6. Add a thin controller under `catalog/controller`.
7. Add a new Flyway migration `V2__...sql` (never edit `V1`).
8. Add unit, slice and integration tests.

---

## Technology stack

Java 25 · Spring Boot 4.1.x · Spring Web MVC · Spring Data JPA / Hibernate ·
PostgreSQL 18 · Flyway · Jakarta Bean Validation · Spring Boot Actuator ·
OpenAPI/Swagger (springdoc) · JUnit 5 · Mockito · Testcontainers · Docker ·
Docker Compose.
