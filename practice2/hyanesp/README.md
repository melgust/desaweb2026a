# API REST de Personas

API REST desarrollada con PHP 8, sin frameworks y sin base de datos. La información se almacena en un archivo JSON.

## Funcionalidades

- Registrar personas.
- Consultar todas las personas.
- Consultar una persona por ID.
- Actualizar una persona.
- Eliminar una persona.
- Calcular la edad de una persona.
- Validar nombre, correo electrónico y fecha de nacimiento.
- Evitar correos electrónicos duplicados.

## Estructura del proyecto

```text
hyanesp/
├── api/
│   └── index.php
├── controllers/
│   └── PersonController.php
├── data/
│   └── persons.json
├── dto/
│   └── PersonDTO.php
├── helpers/
│   └── FileManager.php
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Conceptos utilizados

### API REST

Una API REST permite la comunicación entre aplicaciones mediante solicitudes HTTP.

### DTO

`PersonDTO` representa los datos de una persona y permite convertirlos en un arreglo para almacenarlos en formato JSON.

### Controller

`PersonController` contiene la lógica para registrar, consultar, actualizar y eliminar personas.

### Helper

`FileManager` se encarga de leer y escribir la información en el archivo `persons.json`.

### JSON

JSON es el formato utilizado para enviar, recibir y almacenar los datos.

## Datos de una persona

```json
{
  "id": 1,
  "name": "Juan Pérez",
  "birthday": "2000-05-15",
  "email": "juan@example.com"
}
```

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/persons` | Consultar todas las personas |
| POST | `/api/persons` | Registrar una persona |
| GET | `/api/persons/{id}` | Consultar una persona |
| PUT | `/api/persons/{id}` | Actualizar una persona |
| DELETE | `/api/persons/{id}` | Eliminar una persona |
| GET | `/api/persons/{id}/age` | Calcular la edad |

## Ejecutar con Docker

Desde la carpeta `hyanesp`, ejecutar:

```bash
docker compose up --build
```

La API estará disponible en:

```text
http://localhost:8000
```

Para detener el contenedor:

```bash
docker compose down
```

## Pruebas con curl

### Registrar una persona

```bash
curl -X POST http://localhost:8000/api/persons \
-H "Content-Type: application/json" \
-d "{\"name\":\"Juan Pérez\",\"birthday\":\"2000-05-15\",\"email\":\"juan@example.com\"}"
```

### Consultar todas las personas

```bash
curl http://localhost:8000/api/persons
```

### Consultar una persona por ID

```bash
curl http://localhost:8000/api/persons/1
```

### Actualizar una persona

```bash
curl -X PUT http://localhost:8000/api/persons/1 \
-H "Content-Type: application/json" \
-d "{\"name\":\"Juan Carlos Pérez\",\"email\":\"juancarlos@example.com\"}"
```

### Consultar la edad

```bash
curl http://localhost:8000/api/persons/1/age
```

### Eliminar una persona

```bash
curl -X DELETE http://localhost:8000/api/persons/1
```

## Validaciones

- El nombre es obligatorio.
- El correo electrónico es obligatorio.
- El correo debe tener un formato válido.
- El correo no puede estar repetido.
- La fecha de nacimiento es obligatoria.
- La fecha debe utilizar el formato `YYYY-MM-DD`.
- La fecha de nacimiento no puede ser futura.
