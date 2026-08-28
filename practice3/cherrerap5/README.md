# Enterprise Management Solution

Full-stack enterprise application built with **.NET 10 Web API**, **Angular 18**, and **MySQL 8**.

The backend follows a layered (Clean Architecture) structure — Api, Application, Domain, Infrastructure — compiled as a single project. It uses JWT authentication with role-based authorization (Admin, Manager, User), Entity Framework Core with the Pomelo MySQL provider, and BCrypt password hashing.

## Tech Stack

| Layer     | Technology                                             |
|-----------|--------------------------------------------------------|
| Frontend  | Angular 18 (standalone components), served via Nginx   |
| Backend   | ASP.NET Core 10 Web API, EF Core 9 (Pomelo MySQL)      |
| Database  | MySQL 8.0                                               |
| Auth      | JWT Bearer tokens, BCrypt password hashing             |

## Ports

When running via Docker Compose, the host-side ports are:

| Service   | Host URL / Port           | Container Port | Notes                                    |
|-----------|---------------------------|----------------|------------------------------------------|
| Frontend  | `http://localhost:81`     | 80             | Angular app served by Nginx              |
| Backend   | `http://localhost:5000`   | 80             | REST API + Swagger                       |
| MySQL     | `localhost:3307`          | 3306           | `root` / `YourSecurePassword123!`        |

Useful backend URLs:

- **API base**: `http://localhost:5000/api`
- **Swagger** (Development only): `http://localhost:5000/swagger`

> Note: inside the Docker network the backend reaches MySQL at `Server=db` on port `3306` (not the host port `3307`). The frontend calls the API at `http://localhost:5000/api` from the browser.

## Quick Start (Docker)

Run the whole stack (MySQL + Backend + Frontend):

```bash
docker compose up -d --build
```

On startup the backend automatically:

1. Applies EF Core migrations (creates the `Users`, `Roles`, and `Products` tables).
2. Seeds default roles and users (see [Seeded Accounts](#seeded-accounts)).

Then open <http://localhost:81> and log in.

The inventory starts with 75 deterministic demo products so both pagination
modes are easy to test. Change the amount in `docker-compose.yml` before
starting the backend, for example:

```yaml
InventorySeed__ProductCount=250
```

The seed accepts between 0 and 10,000 products and is idempotent: restarting
does not duplicate records. In the product list, use **Pages** for traditional
offset pagination or **Infinite scroll** to append the next offset page when
the inventory panel reaches the bottom.

To stop and remove the containers:

```bash
docker compose down
```

To also wipe the database volume (fresh start):

```bash
docker compose down -v
```

## Seeded Accounts

The database is seeded on first startup with these accounts (idempotent — safe on every run):

| Role  | Email                   | Password    |
|-------|-------------------------|-------------|
| Admin | admin@enterprise.com    | `Admin123!` |
| User  | user@enterprise.com     | `User123!`  |

Roles seeded: **Admin** (full access), **Manager** (manage products), **User** (read-only).

> These are development defaults. Change them before using anywhere beyond local development.

### Role permissions (products)

| Action              | Admin | Manager | User |
|---------------------|:-----:|:-------:|:----:|
| View / list         |  ✅   |   ✅    |  ✅  |
| Create / update     |  ✅   |   ✅    |  ❌  |
| Delete              |  ✅   |   ❌    |  ❌  |

## Manual Development Setup

Requires the **.NET 10 SDK** (pinned via `backend/global.json`), **Node.js 20+**, and a reachable **MySQL 8** instance.

### 1. Start a MySQL instance

```bash
docker run --name enterprise_db \
  -e MYSQL_ROOT_PASSWORD=YourSecurePassword123! \
  -e MYSQL_DATABASE=EnterpriseDb \
  -p 3307:3306 -d mysql:8.0
```

### 2. Backend

The default connection string in `appsettings.json` points to `Server=localhost` on port `3306`. If you use the container above (host port `3307`), override the connection string:

```bash
cd backend
export ConnectionStrings__DefaultConnection="Server=localhost;Port=3307;Database=EnterpriseDb;User Id=root;Password=YourSecurePassword123!;"
dotnet run --project src/Api/Api.csproj
```

The API starts, applies migrations, and seeds the default accounts. It listens on `http://localhost:5000` by default when run this way (adjust `ASPNETCORE_URLS` if needed).

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

The dev server runs on `http://localhost:4200` and calls the API at `http://localhost:5000/api` (from `src/environments/environment.ts`). Production builds use `environment.prod.ts` via the `fileReplacements` configured in `angular.json`.

## Database Migrations

Migrations live in `backend/src/Infrastructure/Data/Migrations`. A design-time factory (`AppDbContextFactory`) lets EF tooling build the context without a live database.

Create a new migration:

```bash
cd backend
dotnet ef migrations add <Name> --project src/Api/Api.csproj --output-dir ../Infrastructure/Data/Migrations
```

Apply migrations manually (usually not needed — the app does this on startup):

```bash
dotnet ef database update --project src/Api/Api.csproj
```

## API Overview

| Method | Endpoint                | Auth            | Description              |
|--------|-------------------------|-----------------|--------------------------|
| POST   | `/api/auth/login`       | Anonymous       | Authenticate, get JWT    |
| GET    | `/api/products`         | Any role        | List products (paged)    |
| GET    | `/api/products/{id}`    | Any role        | Get a product            |
| POST   | `/api/products`         | Admin, Manager  | Create a product         |
| PUT    | `/api/products/{id}`    | Admin, Manager  | Update a product         |
| DELETE | `/api/products/{id}`    | Admin           | Delete a product         |

`GET /api/products` supports query params: `search`, `sortBy` (`name`, `price`, `stock`, `createdat`), `sortDirection` (`asc`/`desc`), `page`, `pageSize`.

## Project Structure

```text
.
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── global.json                 # pins .NET SDK 10
│   └── src/
│       ├── Api/                    # controllers, Program.cs, appsettings
│       ├── Application/            # DTOs, services (auth, products)
│       ├── Domain/                 # entities (User, Role, Product)
│       └── Infrastructure/         # AppDbContext, migrations, seeder
└── frontend/
    ├── Dockerfile
    └── src/
        ├── app/                    # components, services, guards, interceptors
        └── environments/           # environment.ts / environment.prod.ts
```
