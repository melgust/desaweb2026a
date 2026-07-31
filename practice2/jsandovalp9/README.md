# API REST de Personas

Este proyecto implementa una API REST con PHP puro y almacenamiento en `JSON`.

## Estructura del proyecto

- `api/index.php`: Punto de entrada de la API.
- `controllers/PersonController.php`: Controlador que gestiona las operaciones de la API.
- `dto/PersonDTO.php`: DTO para representar una persona.
- `helpers/FileManager.php`: Helper para leer y escribir el archivo JSON.
- `data/persons.json`: Archivo de almacenamiento de los registros.
- `Dockerfile`: Contenedor para ejecutar la API.
- `docker-compose.yml`: Opcional para levantar el servicio con Docker Compose.

## Cómo ejecutar

Construir el contenedor:

```bash
docker compose up --build
```

La API estará disponible en:

```text
    http://localhost:8080/api/persons
```

## Endpoints

- `POST /api/persons` - Crear una persona
- `GET /api/persons` - Obtener todas las personas
- `GET /api/persons/{id}` - Obtener persona por ID
- `PUT /api/persons/{id}` - Actualizar persona
- `DELETE /api/persons/{id}` - Eliminar persona
- `GET /api/persons/{id}/age` - Obtener edad

## Ejemplos con curl

Crear una persona:

```bash
curl -X POST http://localhost:8080/api/persons \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan Pérez","birthday":"1998-06-15","email":"juan@email.com"}'
```

Obtener todas las personas:

```bash
curl http://localhost:8080/api/persons
```

Obtener por ID:

```bash
curl http://localhost:8080/api/persons/1
```

Actualizar una persona:

```bash
curl -X PUT http://localhost:8080/api/persons/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan Pérez","birthday":"1998-06-15","email":"juan.nuevo@email.com"}'
```

Eliminar una persona:

```bash
curl -X DELETE http://localhost:8080/api/persons/1
```

Obtener la edad:

```bash
curl http://localhost:8080/api/persons/1/age
```

## Qué es un DTO, un Controller y un Helper

- **DTO (Data Transfer Object)**: es una clase que representa los datos de una persona y facilita su traslado entre capas del sistema. En este proyecto, `PersonDTO` encapsula `id`, `name`, `birthday` y `email` y ofrece `toArray()` para convertir la entidad en un arreglo.

- **Controller**: centraliza la lógica de negocio y coordina las operaciones que responden a las solicitudes HTTP. Aquí, `PersonController` gestiona la creación, lectura, actualización, eliminación y cálculo de edad.

- **Helper**: provee funciones auxiliares independientes de la lógica principal. `FileManager` encapsula la lectura y escritura de `data/persons.json`, aislando el manejo de archivos del controlador.
