# Catalog Microservice

Microservicio independiente para el catálogo de **Products** y **Categories**, construido con **Spring Boot 3 + MongoDB**. Vive dentro de este mismo repositorio, junto a `backend/` (.NET) y `frontend/` (Angular), pero corre como un servicio aparte con su propia base de datos NoSQL.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Spring Boot 3.3 (Java 21) |
| Base de datos | MongoDB 7 |
| Persistencia | Spring Data MongoDB |

## Cómo se modela la relación Category → Product

A diferencia del backend .NET (relacional, con `CategoryId` como llave foránea), aquí se usa el patrón típico de MongoDB: cada `Product` **embebe una copia** (`CategoryRef`: id + name) de su categoría al momento de guardarse, en vez de hacer un `JOIN`. Esto evita una segunda consulta al leer productos, a cambio de que si renombras una categoría, los productos ya guardados conservan el nombre anterior hasta que se vuelvan a guardar. Es una decisión de diseño intencional en NoSQL (denormalización), no un descuido.

## Levantar el servicio

Ya está integrado al `docker-compose.yml` de la raíz del proyecto:

```bash
docker compose up -d --build mongo catalog
```

- Catalog API: `http://localhost:5001/api/catalog`
- MongoDB (host): `localhost:27018` (dentro de la red de Docker, el propio `catalog` se conecta a `mongo:27017`)
- Health check: `http://localhost:5001/actuator/health`

## Endpoints

### Categories

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/catalog/categories` | Lista todas las categorías |
| GET | `/api/catalog/categories/{id}` | Obtiene una categoría |
| POST | `/api/catalog/categories` | Crea una categoría |
| PUT | `/api/catalog/categories/{id}` | Actualiza una categoría |
| DELETE | `/api/catalog/categories/{id}` | Elimina una categoría (falla si tiene productos asignados) |

### Products

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/catalog/products` | Lista paginada. Query params: `search`, `sortBy` (name/price/stock/createdat), `sortDirection` (asc/desc), `page`, `pageSize` |
| GET | `/api/catalog/products/{id}` | Obtiene un producto |
| POST | `/api/catalog/products` | Crea un producto (`categoryId` opcional) |
| PUT | `/api/catalog/products/{id}` | Actualiza un producto |
| DELETE | `/api/catalog/products/{id}` | Elimina un producto |

### Ejemplo de payload (crear producto)

```json
{
  "name": "Wireless Mouse",
  "description": "2.4GHz wireless mouse",
  "price": 19.99,
  "stock": 120,
  "isActive": true,
  "categoryId": "<id de una categoría existente, o null>"
}
```

## Desarrollo local (sin Docker)

Requiere JDK 21, Maven y una instancia de MongoDB accesible.

```bash
cd catalog
export MONGODB_URI="mongodb://localhost:27017/catalogdb"
mvn spring-boot:run
```
