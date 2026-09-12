# Containers

Current architecture and migration details: [MICROSERVICES.md](MICROSERVICES.md).

| Compose service | Default container | Host port | Storage / purpose |
|---|---|---|---|
| frontend | crobless-frontend-1 | 81 | Angular through Nginx |
| backend | crobless-backend-1 | 5000 | .NET authentication, products, categories |
| db | crobless-db-1 | 3307 | MySQL; volume db_data |
| purchasing | crobless-purchasing-1 | 8081 | Spring Boot suppliers and invoices |
| mongo | crobless-mongo-1 | Not published | MongoDB replica set rs0; volume mongo_data |

Compose prefixes container and volume names with the project name, avoiding conflicts with other exercises.

The backend connects to MySQL at `db:3306`. Spring connects to `mongo:27017` and calls the catalog at `backend:80`. .NET calls Spring at `purchasing:8081`. The browser calls .NET at `localhost:5000/api` and Spring at `localhost:8081/api`.

Spring waits for MongoDB to elect a primary, then imports the archived suppliers/invoices once. Angular starts after Spring readiness succeeds. Nginx serves direct Angular routes through index.html.

```powershell
docker compose config --quiet
docker compose up --build -d
docker compose ps
docker compose logs purchasing --tail 50
docker compose exec backend sh
docker compose exec mongo mongosh purchasing
```

Normal restarts preserve both databases. The SQL purchasing tables remain as an archive; active purchasing data lives in MongoDB. See MICROSERVICES.md before attempting a data rollback.
