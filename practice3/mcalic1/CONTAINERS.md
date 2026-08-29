# Containers & Networking

This document explains how the Docker containers in this project fit together and clarifies exactly how port `3307` relates to the backend and the MySQL database.

## The three containers

`docker-compose.yml` defines three services that run as separate containers on a shared, automatically-created Docker network:

| Service    | Container name        | Image / Build           | Host port -> Container port |
|------------|-----------------------|-------------------------|-----------------------------|
| `db`       | `enterprise_db`       | `mysql:8.0`             | `3307` -> `3306`            |
| `backend`  | `enterprise_backend`  | built from `./backend`  | `5000` -> `80`              |
| `frontend` | `enterprise_frontend` | built from `./frontend` | `81` -> `80`                |

Startup order is controlled by `depends_on`: `db` starts first, then `backend`, then `frontend`.

## How the containers talk to each other

Docker Compose puts every service on the same user-defined bridge network and registers each one under its **service name** as a DNS hostname. So inside the network:

- `backend` reaches the database at the hostname **`db`**.
- `frontend` (via the browser) reaches the API through the host, not the network (explained below).

```text
                         Docker network (internal)
   ┌───────────────┐        db:3306        ┌───────────────┐
   │   backend     │ ────────────────────▶ │      db       │
   │ (listens :80) │                        │ MySQL :3306   │
   └───────┬───────┘                        └───────────────┘
           │
   host :5000 → :80                       host :3307 → :3306
           │                                       │
           ▼                                       ▼
   ┌──────────────────────── Host machine ────────────────────────┐
   │  http://localhost:5000  (API)     localhost:3307  (MySQL)     │
   │  http://localhost:81    (frontend, host :81 → container :80)  │
   └──────────────────────────────────────────────────────────────┘
```

## The important part: ports 3306 vs 3307

A Docker port mapping like `"3307:3306"` has two sides:

- **`3306`** — the port **inside** the container. MySQL always listens on `3306`. This is what other containers on the Docker network use.
- **`3307`** — the port published on the **host machine**. It forwards to the container's `3306`.

So there are two different ways to reach the same database:

| Who is connecting                | Host / address used | Port |
|----------------------------------|---------------------|------|
| `backend` container (in Docker)  | `db`                | 3306 |
| Your machine / a local backend   | `localhost`         | 3307 |

### Does the backend use 3307?

It depends on **where the backend is running**:

- **Inside Docker Compose** — No. The backend uses the connection string injected by `docker-compose.yml`:

  ```text
  Server=db;Database=EnterpriseDb;User Id=root;Password=YourSecurePassword123!;
  ```

  There is no port in that string, so it uses MySQL's default `3306` and resolves `db` via the Docker network. The `3307` host mapping is **not** involved here — containers bypass the host and talk directly over the internal network on `3306`.

- **Running the backend locally (outside Docker), against the Dockerized MySQL** — Yes. From the host there is no `db` hostname, and the container's `3306` is only reachable through the published host port `3307`. So you point the backend at `localhost:3307`:

  ```bash
  export ConnectionStrings__DefaultConnection="Server=localhost;Port=3307;Database=EnterpriseDb;User Id=root;Password=YourSecurePassword123!;"
  dotnet run --project src/Api/Api.csproj
  ```

**Summary:** `3307` is the *host-facing* door to MySQL, used only when something on your machine (like a locally-run backend or a DB GUI) connects. The containerized backend goes through the internal Docker network on `3306` using the hostname `db`.

## Why `3307` and not `3306` on the host?

The host mapping was changed to `3307` to avoid clashing with any MySQL instance you may already have running locally on the default `3306`. It only affects the host side; nothing inside the containers changes.

## How the frontend reaches the backend

The Angular app runs in the **browser**, not inside the Docker network. It calls the API using the URL in `frontend/src/environments/environment.ts`:

```text
http://localhost:5000/api
```

The browser hits the host-published backend port `5000`, which Docker forwards to the backend container's port `80`. Because the frontend uses `localhost:5000` (the host), it does not use the Docker service name `backend`. The backend enables CORS so these cross-origin browser calls are allowed.

## Data persistence

MySQL data is stored in the named volume `db_data`, mounted at `/var/lib/mysql`. Data survives `docker compose down`. To wipe it and start fresh:

```bash
docker compose down -v
```

On startup the backend automatically applies EF Core migrations (creating the tables) and seeds the default roles and users.

## Common commands

```bash
# Build and start everything in the background
docker compose up -d --build

# Follow backend logs
docker compose logs -f backend

# Connect to MySQL from the host (uses the 3307 host mapping)
mysql -h 127.0.0.1 -P 3307 -u root -p

# Open a shell inside the running backend container
docker exec -it enterprise_backend sh

# Stop and remove containers (keep data)
docker compose down

# Stop, remove containers, and delete the database volume
docker compose down -v
```

## Access summary

| What          | URL / address                   |
|---------------|---------------------------------|
| Frontend      | `http://localhost:81`           |
| Backend API   | `http://localhost:5000/api`     |
| Swagger (dev) | `http://localhost:5000/swagger` |
| MySQL (host)  | `localhost:3307`                |
