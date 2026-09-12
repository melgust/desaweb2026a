# catalogo

A **Catalog microservice** built with **Java 25**, **Spring Boot 4.1.x** and **MongoDB 7**, designed to keep business logic independent from the persistence technology and ready to evolve as a service-oriented system.

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
catalogo-service
   |
   v
MongoDB
```

Every endpoint is directly reachable **without any `Authorization` header**.

```bash
curl http://localhost:8081/api/v1/products   # works, no token required
```

---

## 1. Project purpose

Provide the catalog capability (products) for an online store as an independent,
production-style microservice. The business rules live in the service layer and
are not tied to a specific database engine.

## 2. Current architecture

The client (Postman, frontend, curl) calls the service directly, which talks to
MongoDB. There is no gateway and no identity provider yet.

## 3. Future architecture

```
FUTURE STATE

Client
   |
   v
API Gateway
   |
   v
catalogo-service
   |
   v
MongoDB

Identity Provider
   |
   +-- OAuth2 / OIDC
   |
   +-- JWT access tokens
```

The code is structured so this evolution requires **no changes to business
logic** — only security configuration and gateway infrastructure.

## 4. Package structure

```
com.practica4.catalogo
├── CatalogoApplication.java        # entry point
├── controller/                    # thin HTTP layer
├── dto/                           # HTTP contract (records)
├── entity/                        # Mongo document + enum
├── exception/                     # business exceptions + handler
├── mapper/                        # entity <-> DTO conversions
├── repository/                    # persistence abstraction + Mongo implementation
├── service/                       # business logic + transaction boundaries
└── config/                        # future configuration (if required)
```

## 5. Controller responsibilities

`ProductController` only receives HTTP requests, validates DTOs, delegates to
`ProductService`, and returns the right status codes. It never touches the
repository directly and contains no business logic.

## 6. DTO responsibilities

DTOs define the HTTP contract and keep the entity internal representation hidden:
- `ProductRequest` — create/update payload with Bean Validation.
- `ProductResponse` — full representation for single-resource endpoints.
- `ProductSummaryResponse` — compact representation for paginated list results.

## 7. Service responsibilities

`ProductService` / `ProductServiceImpl` contain the business rules:
- uniqueness checks for SKU and slug
- existence validation
- domain actions such as create, read, update and delete
- transaction boundaries
- mapper coordination

## 8. Repository responsibilities

`ProductRepository` is the persistence contract, while Mongo-specific behavior is
implemented in `ProductRepositoryImpl`.

Responsibilities:
- CRUD operations
- existence checks by SKU/slug
- derived query methods
- dynamic filtering for `status`, `sku` and full-text search

This keeps the service layer independent from the database engine.

## 9. Entity responsibilities

`Product` is the Mongo document. It contains:
- UUID id
- unique `sku`
- unique `slug`
- business fields such as `name`, `description`, `price`, `currency`, and `status`
- audit timestamps `createdAt` and `updatedAt`
- optimistic locking with `@Version`

## 10. Mapper responsibilities

`ProductMapper` performs explicit conversions:
- `ProductRequest -> Product`
- `Product -> ProductResponse`
- `Product -> ProductSummaryResponse`

Mapping never happens inside controllers.

## 11. MongoDB

MongoDB 7 is the datastore used for the service. Collections are kept simple and
business-oriented, with unique indexes for `sku` and `slug`.

## 12. Docker

The current container setup is designed for a **microservice + database** model:
- one service for Spring Boot
- one service for MongoDB
- a named Docker volume for persistence
- health checks for the database dependency

## 13. Docker Compose

`compose.yml` defines the service stack and starts both containers together.

```bash
docker compose up --build
```

Available endpoints after startup:
- API: `http://localhost:8081`
- MongoDB: `mongodb://localhost:27017/catalogo`

## 14. Local development

Prerequisites: JDK 25, Maven, Docker.

Run the whole environment with Docker Compose:

```bash
docker compose up -d --build
```

If you want to run the application locally without Docker:

```bash
./mvnw spring-boot:run
```

Configuration is read from environment variables with local defaults:

```bash
MONGO_URI=mongodb://localhost:27017/catalogo
SERVER_PORT=8080
```

Swagger UI: `http://localhost:8081/swagger-ui.html`
OpenAPI JSON: `http://localhost:8081/v3/api-docs`

## 15. Running tests

```bash
./mvnw test
```

The project currently includes unit coverage for the business layer using Mockito.

## 16. REST endpoints

| Method | Path                     | Description        | Success |
|--------|--------------------------|--------------------|---------|
| POST   | `/api/v1/products`       | Create product     | 201     |
| GET    | `/api/v1/products`       | List (paged)      | 200     |
| GET    | `/api/v1/products/{id}`  | Get by id         | 200     |
| PUT    | `/api/v1/products/{id}`  | Update product    | 200     |
| DELETE | `/api/v1/products/{id}`  | Delete product    | 204     |

## 17. Pagination

`GET /api/v1/products` uses Spring Data `Pageable`:

```bash
GET /api/v1/products?page=0&size=20&sort=name,asc
```

## 18. Filtering

Optional filters (combinable):

```bash
GET /api/v1/products?status=ACTIVE
GET /api/v1/products?sku=ABC-123
GET /api/v1/products?search=iphone
```

The search is case-insensitive over `name` and `description`.

## 19. Error handling

`GlobalExceptionHandler` returns RFC 9457 Problem Details and never exposes
stack traces.

| Situation                          | Status |
|------------------------------------|--------|
| Validation error                   | 400    |
| Product not found                  | 404    |
| Duplicate SKU/slug                 | 409    |
| Data integrity violation           | 409    |

## 20. Current security state

Authentication is completely disabled: no OAuth2, OIDC, JWT, identity provider,
roles, scopes or API gateway. The service is used directly.

## 21. Future OAuth2/OIDC architecture

The service will later act as an **OAuth2 Resource Server** validating **JWT
access tokens** issued by an external Identity Provider.

## 22. Microservice perspective

This project is intentionally structured as a **single business capability** running
as an independent service, which is the correct foundation for a microservices-based
design. The next step would be to split additional domains (cart, orders,
customers, inventory, etc.) into their own services while preserving the same
architecture pattern.

---

## 23. Quick commands

```bash
docker compose up -d --build
docker compose logs -f
docker compose down
```
