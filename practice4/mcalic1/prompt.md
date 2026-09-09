# Build a Catalog Microservice with Java 25, Spring Boot 4.1 and PostgreSQL

 Act as a **senior software architect and Java backend engineer** specialized in Java 25, Spring Boot, microservices, PostgreSQL, REST APIs, Docker, OAuth 2.0/OIDC, and clean architecture.

 Build from scratch a production-quality microservice named:

```
catalog-service
```

 for an online store.

 The goal of this first stage is to build a **clean, maintainable, testable, and extensible Catalog microservice** following a clear layered architecture.

---

 # 1\. CRITICAL SCOPE — CURRENT STAGE

 This project is intentionally being built in stages.

 ## Authentication is NOT implemented yet

 The current version of the application **must NOT require authentication**.

 The application must work without:

```
Authorization: Bearer <token>
```

 Do NOT implement:

 - Login
- User authentication
- JWT validation
- OAuth2 authentication
- OIDC authentication
- Identity Provider integration
- Keycloak
- Auth0
- User sessions
- User accounts
- Authentication endpoints

 The application must be directly accessible without credentials.

 For example:

```
GET /api/v1/products
```

 must work without an authentication token.

---

 # 2\. API Gateway is NOT implemented yet

 There is currently **NO API Gateway**.

 Do NOT implement:

 - Spring Cloud Gateway
- `gateway-service`
- Gateway routing
- Gateway authentication
- Gateway configuration
- Gateway-specific headers
- Gateway-specific infrastructure

 The current architecture is:

```
Client / Postman / Frontend
            |
            v
    catalog-service
            |
            v
       PostgreSQL
```

 The client must call Catalog directly.

 For example:

```
http://localhost:8080/api/v1/products
```

 Do NOT implement:

```
Client
   |
   v
API Gateway
   |
   v
catalog-service
```

 That is a **future architecture**, not part of this implementation.

---

 # 3\. FUTURE ARCHITECTURE

 The codebase must be designed so that OAuth2/OIDC and an API Gateway can be introduced later without redesigning the business logic.

 The future architecture will be:

```
                         FUTURE

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
   +---- OAuth 2.0 / OIDC
   |
   +---- JWT Access Tokens
```

 However, **DO NOT implement this future architecture now**.

 Preparation means:

 - Keep the application modular.
- Keep business logic independent from authentication.
- Keep Controllers independent from infrastructure.
- Use DTOs.
- Use Services.
- Use Repositories.
- Keep security concerns outside the business/domain logic.
- Design REST endpoints that can be protected later.
- Document the future security architecture.

 Do NOT add authentication just because the application is supposed to support it in the future.

---

 # 4\. Technology Stack

 Use the following technologies:

 - Java 25
- Spring Boot 4.1.x
- Maven
- Spring Web MVC
- Spring Data JPA
- Hibernate
- PostgreSQL 18
- Flyway
- Jakarta Bean Validation
- Spring Boot Actuator
- OpenAPI / Swagger
- JUnit 5
- Mockito
- Testcontainers
- Docker
- Docker Compose

 Do NOT use:

 - H2
- MongoDB
- Redis
- Kafka
- Elasticsearch
- OpenSearch
- Spring Cloud Gateway
- Keycloak
- Auth0
- Any Identity Provider

 Do not introduce technologies that are not necessary for the current scope.

---

 # 5\. Layered Architecture

 The application MUST follow a clear layered architecture:

```
HTTP Request
     |
     v
Controller
     |
     v
Request DTO
     |
     v
Service
     |
     v
Repository
     |
     v
JPA Entity
     |
     v
PostgreSQL
```

 For responses:

```
PostgreSQL
     |
     v
JPA Entity
     |
     v
Repository
     |
     v
Service
     |
     v
Mapper
     |
     v
Response DTO
     |
     v
Controller
     |
     v
HTTP Response
```

 The Controller MUST NOT access the Repository directly.

 The Controller MUST communicate with the Service layer.

---

 # 6\. Project Structure

 Use a package structure similar to:

```
src/
├── main/
│   ├── java/
│   │   └── com/example/catalog/
│   │       │
│   │       ├── CatalogApplication.java
│   │       │
│   │       ├── config/
│   │       │   └── OpenApiConfig.java
│   │       │
│   │       ├── catalog/
│   │       │   │
│   │       │   ├── controller/
│   │       │   │   └── ProductController.java
│   │       │   │
│   │       │   ├── dto/
│   │       │   │   ├── ProductRequest.java
│   │       │   │   ├── ProductResponse.java
│   │       │   │   └── ProductSummaryResponse.java
│   │       │   │
│   │       │   ├── entity/
│   │       │   │   ├── Product.java
│   │       │   │   └── ProductStatus.java
│   │       │   │
│   │       │   ├── mapper/
│   │       │   │   └── ProductMapper.java
│   │       │   │
│   │       │   ├── repository/
│   │       │   │   └── ProductRepository.java
│   │       │   │
│   │       │   └── service/
│   │       │       ├── ProductService.java
│   │       │       └── ProductServiceImpl.java
│   │       │
│   │       └── common/
│   │           └── exception/
│   │               ├── ProductNotFoundException.java
│   │               ├── DuplicateProductException.java
│   │               └── GlobalExceptionHandler.java
│   │
│   └── resources/
│       ├── application.yml
│       ├── application-dev.yml
│       ├── application-test.yml
│       │
│       └── db/
│           └── migration/
│               └── V1__create_products.sql
│
└── test/
```

 Keep the structure simple and extensible.

 Do not introduce unnecessary abstractions.

---

 # 7\. DTOs

 DTOs are mandatory.

 **Never expose JPA entities directly through REST endpoints.**

 The Controller must receive and return DTOs.

 Create at least:

```
ProductRequest
ProductResponse
ProductSummaryResponse
```

 Prefer Java Records for DTOs where appropriate.

 Example:

```
public record ProductRequest(
        @NotBlank
        @Size(max = 50)
        String sku,

        @NotBlank
        @Size(max = 200)
        String name,

        @NotBlank
        @Size(max = 200)
        String slug,

        @Size(max = 5000)
        String description,

        @NotNull
        @PositiveOrZero
        BigDecimal price,

        @NotBlank
        @Size(min = 3, max = 3)
        String currency,

        @NotNull
        ProductStatus status
) {
}
```

 Do not use entities as request or response models.

---

 # 8\. Product Controller

 Create:

```
ProductController
```

 Base path:

```
/api/v1/products
```

 The Controller is responsible only for:

 - Receiving HTTP requests.
- Validating request DTOs.
- Calling the Service.
- Returning response DTOs.
- Returning appropriate HTTP status codes.

 The Controller MUST NOT:

 - Access repositories directly.
- Contain business logic.
- Execute SQL.
- Use `EntityManager`.
- Contain persistence logic.
- Implement business rules.
- Perform complex entity-to-DTO mapping.

 Example:

```
@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<ProductResponse> create(
            @Valid @RequestBody ProductRequest request) {

        ProductResponse response = productService.create(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}
```

 Use constructor injection.

 Do NOT use field injection.

---

 # 9\. Product Service

 Create:

```
ProductService
ProductServiceImpl
```

 The Service layer must contain the business logic.

 It should support:

```
public interface ProductService {

    ProductResponse create(ProductRequest request);

    ProductResponse getById(UUID id);

    Page<ProductSummaryResponse> findAll(
            ProductStatus status,
            String sku,
            String search,
            Pageable pageable);

    ProductResponse update(UUID id, ProductRequest request);

    void delete(UUID id);
}
```

 The Service is responsible for:

 - Business rules.
- Product creation.
- Product updates.
- Product retrieval.
- Product deletion.
- Duplicate validation.
- Existence validation.
- Transaction boundaries.
- Coordinating repositories.
- Calling the mapper.

 Use `@Transactional` at the Service layer.

 Use:

```
@Transactional
```

 for write operations.

 Use:

```
@Transactional(readOnly = true)
```

 for read operations when appropriate.

---

 # 10\. Product Repository

 Create:

```
ProductRepository
```

 using:

```
JpaRepository<Product, UUID>
```

 Example:

```
public interface ProductRepository
        extends JpaRepository<Product, UUID> {

    boolean existsBySku(String sku);

    boolean existsBySlug(String slug);

    Optional<Product> findBySku(String sku);

    Optional<Product> findBySlug(String slug);
}
```

 The Repository layer must be responsible only for persistence.

 Do not put business logic in repositories.

---

 # 11\. Product Mapper

 Create:

```
ProductMapper
```

 It must handle:

```
ProductRequest -> Product
Product -> ProductResponse
Product -> ProductSummaryResponse
```

 Do not perform these mappings inside Controllers.

 Keep the mapper simple and explicit.

---

 # 12\. Product Entity

 Create exactly one business entity:

```
Product
```

 Fields:

```
id
sku
name
slug
description
price
currency
status
createdAt
updatedAt
version
```

 Use UUID for the primary key.

 Use optimistic locking:

```
@Version
private Long version;
```

 Do NOT create JPA relationships yet.

 Do NOT use:

```
@OneToMany
@ManyToOne
@OneToOne
@ManyToMany
```

 There are no related business entities at this stage.

---

 # 13\. Product Status

 Create:

```
public enum ProductStatus {
    DRAFT,
    ACTIVE,
    INACTIVE
}
```

 Persist the enum as a string.

 Do NOT persist enum values as ordinal numbers.

---

 # 14\. Database Scope

 The database must contain exactly **one business table**:

```
products
```

 Do NOT create:

```
categories
brands
product_images
product_attributes
inventory
prices
promotions
reviews
orders
customers
users
roles
permissions
```

 There must be no authentication-related tables.

 There must be no user-related tables.

---

 # 15\. PostgreSQL Schema

 Create the Flyway migration:

```
src/main/resources/db/migration/V1__create_products.sql
```

 The `products` table must contain:

```
id
sku
name
slug
description
price
currency
status
created_at
updated_at
version
```

 Requirements:

 - UUID primary key.
- SKU NOT NULL.
- SKU UNIQUE.
- Name NOT NULL.
- Slug NOT NULL.
- Slug UNIQUE.
- Description nullable.
- Price using `NUMERIC(19,4)`.
- Currency with 3 characters.
- Status persisted as text.
- Created timestamp.
- Updated timestamp.
- Version column.

 Add appropriate:

 - Primary key.
- Unique constraints.
- NOT NULL constraints.
- Indexes.

---

 # 16\. Flyway

 Flyway must manage database schema migrations.

 Use:

```
V1__create_products.sql
```

 Hibernate must NOT create or modify the schema.

 Configure:

```
spring:
  jpa:
    hibernate:
      ddl-auto: validate
```

 Never use:

```
ddl-auto: update
```

 Flyway owns the database schema.

 Hibernate only validates the mapping against the existing schema.

---

 # 17\. REST API

 Implement:

```
POST   /api/v1/products
GET    /api/v1/products
GET    /api/v1/products/{id}
PUT    /api/v1/products/{id}
DELETE /api/v1/products/{id}
```

 These endpoints must work **without authentication**.

---

 # 18\. Product Listing and Pagination

 The following endpoint:

```
GET /api/v1/products
```

 must support:

```
page
size
sort
```

 Example:

```
GET /api/v1/products?page=0&size=20&sort=name,asc
```

 Support filters:

```
status
sku
search
```

 Examples:

```
GET /api/v1/products?status=ACTIVE

GET /api/v1/products?sku=ABC-123

GET /api/v1/products?search=iphone
```

 Use Spring Data `Pageable`.

 Do not return unlimited product collections.

 Use a dedicated summary DTO for list responses.

---

 # 19\. Business Rules

 The Service layer must enforce:

 - SKU uniqueness.
- Slug uniqueness.
- Product existence before update.
- Product existence before delete.

 The database must also enforce uniqueness constraints.

 Handle database uniqueness violations appropriately.

---

 # 20\. Exception Handling

 Create:

```
ProductNotFoundException
DuplicateProductException
GlobalExceptionHandler
```

 Use:

```
@RestControllerAdvice
```

 Return RFC 9457 Problem Details.

 Handle at least:

```
ProductNotFoundException
DuplicateProductException
MethodArgumentNotValidException
ConstraintViolationException
DataIntegrityViolationException
```

 Do not expose stack traces to API clients.

---

 # 21\. HTTP Status Codes

 Use appropriate status codes:

```
POST create       -> 201 Created
GET               -> 200 OK
PUT               -> 200 OK
DELETE            -> 204 No Content
not found         -> 404 Not Found
validation        -> 400 Bad Request
duplicate         -> 409 Conflict
```

 Do NOT implement authentication-related HTTP behavior yet.

 Therefore:

```
401 Unauthorized
403 Forbidden
```

 are NOT part of the current API behavior.

 They will be introduced in the future security stage.

---

 # 22\. Current Security State

 The current application must have:

```
Authentication: DISABLED
OAuth2:         DISABLED
OIDC:           DISABLED
JWT:            DISABLED
Identity Provider: NONE
Roles:          NOT ENFORCED
Scopes:         NOT ENFORCED
API Gateway:    NONE
```

 The application must be usable directly:

```
Client
   |
   v
catalog-service
   |
   v
PostgreSQL
```

 Do not require any token.

 Do not require any role.

 Do not require any scope.

---

 # 23\. Future Security Model

 Document, but DO NOT IMPLEMENT, the future security model.

 The future system will use:

```
OAuth 2.0 / OIDC
```

 with an external Identity Provider.

 Catalog will eventually act as:

```
OAuth2 Resource Server
```

 using JWT access tokens.

 Future scopes:

```
catalog:read
catalog:write
catalog:admin
```

 Future conceptual roles:

```
CUSTOMER
CATALOG_MANAGER
ADMIN
```

 Scopes should primarily represent API permissions.

 Roles should represent user profiles and may be used for business-specific authorization rules.

 The future authorization model could be:

```
CUSTOMER
    |
    +-- catalog:read

CATALOG_MANAGER
    |
    +-- catalog:read
    +-- catalog:write

ADMIN
    |
    +-- catalog:read
    +-- catalog:write
    +-- catalog:admin
```

 However, **do not implement any of this yet**.

 Do not add `@PreAuthorize`.

 Do not add JWT configuration.

 Do not add `SecurityFilterChain`.

 Do not add an Identity Provider.

 Do not add OAuth2 dependencies unless they are strictly necessary for documentation/preparation without enabling security.

 The application must remain completely unauthenticated.

---

 # 24\. Future API Gateway

 Document the future architecture:

```
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
```

 The Gateway may eventually handle:

 - Routing.
- Global security policies.
- Rate limiting.
- CORS.
- Request correlation.
- Cross-cutting concerns.

 However, Catalog must remain independently executable.

 The current application must NOT depend on a Gateway.

---

 # 25\. Configuration

 Use environment variables for database configuration.

 Example:

```
spring:
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/catalog}
    username: ${DATABASE_USERNAME:catalog}
    password: ${DATABASE_PASSWORD:catalog}
```

 Do not commit real production credentials.

---

 # 26\. Docker

 Create a:

```
Dockerfile
```

 Use Java 25.

 Prefer a multi-stage build.

 The final image should:

 - Use a Java 25 runtime.
- Run as a non-root user.
- Expose the application port.
- Receive configuration through environment variables.

---

 # 27\. Docker Compose

 Create:

```
compose.yml
```

 with exactly:

```
catalog-service
postgres
```

 Do NOT add:

```
api-gateway
keycloak
identity-provider
redis
kafka
```

 PostgreSQL development configuration:

```
database: catalog
username: catalog
password: catalog
```

 These credentials are for local development only.

 Configure:

 - Persistent PostgreSQL volume.
- PostgreSQL healthcheck.
- Catalog dependency on a healthy PostgreSQL container.

 The entire project must start with:

```
docker compose up --build
```

---

 # 28\. Actuator

 Add Spring Boot Actuator.

 Expose at least:

```
/actuator/health
/actuator/info
```

 Prepare health information for future container orchestration:

```
liveness
readiness
```

 Do not expose all Actuator endpoints unnecessarily.

---

 # 29\. OpenAPI

 Add OpenAPI / Swagger documentation.

 Document:

 - Product endpoints.
- Request DTOs.
- Response DTOs.
- Validation rules.
- Pagination.
- Filters.
- HTTP status codes.
- Error responses.

 Do NOT make authentication appear to be a current requirement.

 You may document future Bearer JWT support in a clearly labeled **Future Security** section, but the current API must remain unauthenticated.

---

 # 30\. Testing

 Implement tests for each layer.

 ## ProductServiceTest

 Use Mockito.

 Test:

 - Create product.
- Duplicate SKU.
- Duplicate slug.
- Product not found.
- Update product.
- Delete product.

 ## ProductControllerTest

 Use:

```
@WebMvcTest
MockMvc
```

 Test:

 - POST.
- GET.
- PUT.
- DELETE.
- Validation.
- HTTP status codes.
- JSON responses.
- Error handling.

 Mock the Service.

 The Controller tests must not require PostgreSQL.

 ## Repository Tests

 Use PostgreSQL through Testcontainers.

 Do NOT use H2.

 ## Integration Tests

 Use:

```
@SpringBootTest
Testcontainers
PostgreSQL
```

 Test the complete flow:

```
HTTP
 |
 v
Controller
 |
 v
Service
 |
 v
Repository
 |
 v
PostgreSQL
```

 Verify that Flyway migrations execute correctly.

---

 # 31\. Security Tests

 Do NOT create authentication tests in this stage.

 There is currently:

```
No JWT
No OAuth2
No OIDC
No Identity Provider
No roles
No scopes
```

 Instead, explicitly verify that the API works without authentication.

 For example:

```
GET /api/v1/products
```

 must succeed without:

```
Authorization
```

 Future authentication tests will be added when OAuth2/OIDC is implemented.

---

 # 32\. Clean Code Requirements

 Follow these principles:

 - Constructor injection.
- No field injection.
- Controllers must be thin.
- Services contain business logic.
- Repositories contain persistence logic.
- DTOs define the HTTP contract.
- Entities represent persistence/domain state.
- Mappers handle conversions.
- Validation uses Jakarta Bean Validation.
- Use specific business exceptions.
- Keep methods small.
- Keep classes focused.
- Use meaningful names.
- Use Java Records where appropriate.

 Avoid:

 - Generic repositories.
- Generic services.
- Giant classes.
- Giant methods.
- Unnecessary interfaces.
- Unnecessary abstractions.
- Entity exposure through REST.
- Business logic inside Controllers.
- Direct Controller → Repository access.

---

 # 33\. Extensibility

 The current catalog contains only:

```
catalog
└── Product
```

 Future developers may add:

```
catalog
├── Product
├── Category
├── Brand
├── ProductImage
└── ProductAttribute
```

 Every future business entity should follow the same architectural pattern:

```
Controller
    |
    v
DTO
    |
    v
Service
    |
    v
Repository
    |
    v
Entity
    |
    v
Mapper
    |
    v
Tests
    |
    v
Flyway Migration
```

 The current implementation must not prevent this evolution.

---

 # 34\. README

 Create a complete README explaining:

 1. Project purpose.
2. Current architecture.
3. Future architecture.
4. Package structure.
5. Controller responsibilities.
6. DTO responsibilities.
7. Service responsibilities.
8. Repository responsibilities.
9. Entity responsibilities.
10. Mapper responsibilities.
11. PostgreSQL.
12. Flyway.
13. Docker.
14. Docker Compose.
15. Local development.
16. Running tests.
17. REST endpoints.
18. Pagination.
19. Filtering.
20. Error handling.
21. Current security state.
22. Future OAuth2/OIDC architecture.
23. Future roles and scopes.
24. Future API Gateway.
25. How to add future entities.

 The README MUST clearly state:

```
CURRENT STATE

Authentication: OFF
OAuth2: OFF
OIDC: OFF
JWT: OFF
Identity Provider: NONE
API Gateway: NONE

Architecture:

Client
   |
   v
catalog-service
   |
   v
PostgreSQL
```

 And separately:

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
   +-- OAuth2/OIDC
   |
   +-- JWT
```

---

 # 35\. Acceptance Criteria

 The implementation is complete only if all of the following are true:

 - [ ] Java 25.
- [ ] Spring Boot 4.1.x.
- [ ] Maven.
- [ ] PostgreSQL 18.
- [ ] Spring Web MVC.
- [ ] Product Controller.
- [ ] Product Request DTO.
- [ ] Product Response DTO.
- [ ] Product Summary DTO.
- [ ] Product Service interface.
- [ ] Product Service implementation.
- [ ] Product Repository.
- [ ] Product Entity.
- [ ] Product Mapper.
- [ ] Product Status enum.
- [ ] Business exceptions.
- [ ] Global exception handler.
- [ ] Jakarta Bean Validation.
- [ ] REST API under `/api/v1`.
- [ ] Product CRUD.
- [ ] Pagination.
- [ ] Filtering.
- [ ] UUID.
- [ ] BigDecimal for monetary values.
- [ ] Optimistic locking.
- [ ] Flyway.
- [ ] `ddl-auto: validate`.
- [ ] PostgreSQL.
- [ ] Dockerfile.
- [ ] Docker Compose.
- [ ] Actuator.
- [ ] OpenAPI.
- [ ] Unit tests.
- [ ] Controller tests.
- [ ] Repository tests.
- [ ] Integration tests.
- [ ] Testcontainers.
- [ ] README.

 ## Critical restrictions

 The project MUST NOT contain:

 - [ ] Authentication.
- [ ] JWT authentication.
- [ ] OAuth2 authentication.
- [ ] OIDC authentication.
- [ ] Identity Provider.
- [ ] Keycloak.
- [ ] Auth0.
- [ ] API Gateway.
- [ ] Spring Cloud Gateway.
- [ ] User accounts.
- [ ] User tables.
- [ ] Role tables.
- [ ] Permission tables.
- [ ] Authentication-related database tables.

 The database MUST contain exactly one business table:

```
products
```

 The application MUST be directly accessible:

```
Client
   |
   v
catalog-service
   |
   v
PostgreSQL
```

 with **no authentication and no API Gateway**.

 OAuth2/OIDC, JWT, roles, scopes, and API Gateway are explicitly defined as **future stages only**.

 Do not implement future-stage functionality prematurely.
