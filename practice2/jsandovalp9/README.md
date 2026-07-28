# API REST PHP Contenerizada

Ejemplo simple de una API REST en PHP sin base de datos.

## Instrucciones

1. Construir la imagen Docker:
   ```bash
   docker compose build
   ```

2. Iniciar el contenedor:
   ```bash
   docker compose up -d
   ```

3. Probar la API:
   - `GET http://localhost:8080/api/tasks`
   - `GET http://localhost:8080/api/tasks/1`
   - `POST http://localhost:8080/api/tasks`
   - `PUT http://localhost:8080/api/tasks/1`
   - `DELETE http://localhost:8080/api/tasks/1`

## Endpoints

- `GET /api/tasks`
- `GET /api/tasks/{id}`
- `POST /api/tasks`
- `PUT /api/tasks/{id}`
- `DELETE /api/tasks/{id}`
