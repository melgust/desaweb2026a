# API REST de Gestión de Personas

Una API REST desarrollada en **PHP 8 puro** (sin frameworks) para gestionar información de personas con almacenamiento en archivos JSON.

## Instrucciones de Ejecución

### Requisitos Previos
- Docker y Docker Compose instalados
- Puerto 8080 disponible en tu máquina

### Paso 1: Construir la Imagen Docker

```bash
docker-compose build
```

### Paso 2: Iniciar el Contenedor

```bash
docker-compose up -d
```

El contenedor estará disponible en: `http://localhost:8080/api/persons`

### Paso 3: Detener el Contenedor

```bash
docker-compose down
```

### Paso 4: Ver Logs

```bash
docker-compose logs -f api
```

---

## Estructura del Proyecto

```
mcali/
├── api/
│   ├── index.php          # Punto de entrada de la API
│   └── .htaccess          # Configuración de URL rewriting
├── controllers/
│   └── PersonController.php   # Controlador principal
├── dto/
│   └── PersonDTO.php          # Data Transfer Object
├── helpers/
│   └── FileManager.php        # Gestor de archivos JSON
├── data/
│   └── persons.json           # Base de datos JSON
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Conceptos Implementados

### Data Transfer Object (DTO)

Un **DTO (Data Transfer Object)** es un patrón de diseño que encapsula datos en un objeto simple para transferir información entre diferentes capas de la aplicación. Sus ventajas principales son:

- **Separación de responsabilidades**: Aísla la transferencia de datos de la lógica de negocio
- **Type safety**: Proporciona tipado de datos y validación a nivel de objeto
- **Facilita el mantenimiento**: Cambios en la estructura de datos se hacen en un único lugar
- **Mejora la legibilidad**: El código es más claro y autodocumentado

En este proyecto, `PersonDTO` representa la estructura de datos de una persona con sus atributos (id, name, birthday, email) y métodos para convertir a array (`toArray()`).

### Controller

Un **Controller** es responsable de:

- **Recibir y procesar solicitudes HTTP**: Maneja las peticiones GET, POST, PUT, DELETE
- **Validar datos**: Verifica que los datos cumplan con las reglas de negocio
- **Coordinar operaciones**: Orquesta la comunicación entre el Helper y la respuesta
- **Retornar respuestas**: Genera respuestas JSON con el código HTTP apropiado

En `PersonController`, se centraliza toda la lógica de enrutamiento de endpoints y validación de datos, manteniendo el código limpio y organizado.

### Helper

Un **Helper** es una clase utilitaria que encapsula operaciones comunes y repetitivas. En este proyecto, `FileManager` gestiona:

- **Lectura y escritura de archivos JSON**
- **Búsqueda de registros** por ID o email
- **Operaciones CRUD**: create, read, update, delete
- **Generación de IDs únicos**: Automáticamente asigna IDs secuenciales

Esta separación permite reutilizar la lógica de persistencia sin duplicar código en el Controller.

---

## API Endpoints

### 1. Crear una Persona

**Método:** `POST`  
**Endpoint:** `/api/persons`

**Solicitud:**
```bash
curl -X POST http://localhost:8080/api/persons \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "birthday": "1998-06-15",
    "email": "juan@email.com"
  }'
```

**Respuesta (201 Created):**
```json
{
    "id": 1,
    "name": "Juan Pérez",
    "birthday": "1998-06-15",
    "email": "juan@email.com"
}
```

---

### 2. Obtener Todas las Personas

**Método:** `GET`  
**Endpoint:** `/api/persons`

**Solicitud:**
```bash
curl http://localhost:8080/api/persons
```

**Respuesta (200 OK):**
```json
[
    {
        "id": 1,
        "name": "Juan Pérez",
        "birthday": "1998-06-15",
        "email": "juan@email.com"
    },
    {
        "id": 2,
        "name": "Ana López",
        "birthday": "1992-10-20",
        "email": "ana@email.com"
    }
]
```

---

### 3. Obtener una Persona por ID

**Método:** `GET`  
**Endpoint:** `/api/persons/{id}`

**Solicitud:**
```bash
curl http://localhost:8080/api/persons/1
```

**Respuesta (200 OK):**
```json
{
    "id": 1,
    "name": "Juan Pérez",
    "birthday": "1998-06-15",
    "email": "juan@email.com"
}
```

**Respuesta si no existe (404 Not Found):**
```json
{
    "message": "Person not found"
}
```

---

### 4. Obtener la Edad de una Persona

**Método:** `GET`  
**Endpoint:** `/api/persons/{id}/age`

**Solicitud:**
```bash
curl http://localhost:8080/api/persons/1/age
```

**Respuesta (200 OK):**
```json
{
    "id": 1,
    "name": "Juan Pérez",
    "age": 26
}
```

---

### 5. Actualizar una Persona

**Método:** `PUT`  
**Endpoint:** `/api/persons/{id}`

**Solicitud:**
```bash
curl -X PUT http://localhost:8080/api/persons/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Carlos Pérez",
    "email": "juancarlos@email.com"
  }'
```

**Respuesta (200 OK):**
```json
{
    "id": 1,
    "name": "Juan Carlos Pérez",
    "birthday": "1998-06-15",
    "email": "juancarlos@email.com"
}
```

---

### 6. Eliminar una Persona

**Método:** `DELETE`  
**Endpoint:** `/api/persons/{id}`

**Solicitud:**
```bash
curl -X DELETE http://localhost:8080/api/persons/1
```

**Respuesta (200 OK):**
```json
{
    "message": "Person deleted successfully"
}
```

---

## Validaciones Implementadas

La API valida automáticamente:

- ✅ Todos los campos son obligatorios en creación
- ✅ El nombre no puede estar vacío
- ✅ El correo debe tener un formato válido
- ✅ No se permiten correos duplicados
- ✅ La fecha de nacimiento debe estar en formato `YYYY-MM-DD`
- ✅ La fecha de nacimiento no puede ser futura
- ✅ La edad se calcula dinámicamente (no se almacena)

### Ejemplo de Error de Validación

**Solicitud con correo inválido:**
```bash
curl -X POST http://localhost:8080/api/persons \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "birthday": "1990-01-01",
    "email": "correo-invalido"
  }'
```

**Respuesta (400 Bad Request):**
```json
{
    "errors": [
        "El formato del correo no es válido."
    ]
}
```

---

## Almacenamiento de Datos

Los datos se almacenan en el archivo `data/persons.json`:

```json
[
    {
        "id": 1,
        "name": "Juan Pérez",
        "birthday": "1998-06-15",
        "email": "juan@email.com"
    }
]
```

El archivo se crea automáticamente al iniciar la API si no existe.

---

## Códigos HTTP Utilizados

| Código | Significado |
|--------|------------|
| `200` | OK - Solicitud exitosa |
| `201` | Created - Recurso creado exitosamente |
| `400` | Bad Request - Datos inválidos o incompletos |
| `404` | Not Found - Recurso no encontrado |
| `500` | Internal Server Error - Error del servidor |

---

## Notas Técnicas

- **PHP 8.3**: Utiliza características modernas de PHP 8
- **Sin frameworks**: Todo el código es PHP puro
- **JSON únicamente**: No utiliza bases de datos
- **POO completa**: Implementa clases y principios de diseño
- **Docker ready**: Fácil de desplegar en contenedores

---

## Licencia

Este proyecto es parte de la práctica académica de Desarrollo Web.
