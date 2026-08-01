# Práctica 2 - API REST con PHP

## Requisitos

- Docker Desktop
- Docker Compose
- Git (opcional)

---

## Estructura del proyecto

```
project/
│
├── api/
│   └── index.php
│
├── controllers/
│   └── PersonController.php
│
├── dto/
│   └── PersonDTO.php
│
├── helpers/
│   └── FileManager.php
│
├── data/
│   └── persons.json
│
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Cómo ejecutar el proyecto

Ubicarse dentro de la carpeta del proyecto y ejecutar:

```bash
docker compose up --build
```

La API estará disponible en:

```
http://localhost:8080
```

Para detener el contenedor:

```bash
docker compose down
```

---

# Explicación de la solución

## DTO (Data Transfer Object)

El DTO es una clase que representa los datos de una persona. Su función es transportar la información entre las diferentes partes del sistema sin incluir lógica de negocio. En este proyecto el DTO contiene los atributos **id**, **name**, **birthday** y **email**, además de sus getters, setters y el método **toArray()** para convertir el objeto en un arreglo.

## Controller

El Controller es el encargado de recibir las solicitudes HTTP y decidir qué operación ejecutar. En este proyecto administra los métodos GET, POST, PUT y DELETE, realiza las validaciones y utiliza el Helper para guardar o leer la información del archivo JSON.

## Helper

El Helper concentra las operaciones relacionadas con el manejo del archivo **persons.json**. Se utiliza para leer y escribir la información, evitando repetir ese código en el Controller y manteniendo una mejor organización del proyecto.

---

# Endpoints

## Obtener todas las personas

```http
GET /api/persons
```

## Obtener una persona por ID

```http
GET /api/persons/{id}
```

## Crear una persona

```http
POST /api/persons
```

## Actualizar una persona

```http
PUT /api/persons/{id}
```

## Eliminar una persona

```http
DELETE /api/persons/{id}
```

## Obtener la edad

```http
GET /api/persons/{id}/age
```

---

# Comandos curl

## Crear persona

```bash
curl -X POST http://localhost:8080/api/persons \
-H "Content-Type: application/json" \
-d '{"name":"Juan Perez","birthday":"1998-06-15","email":"juan@email.com"}'
```

---

## Obtener todas las personas

```bash
curl http://localhost:8080/api/persons
```

---

## Obtener una persona por ID

```bash
curl http://localhost:8080/api/persons/1
```

---

## Actualizar una persona

```bash
curl -X PUT http://localhost:8080/api/persons/1 \
-H "Content-Type: application/json" \
-d '{"name":"Juan Carlos","birthday":"1998-06-15","email":"juancarlos@email.com"}'
```

---

## Eliminar una persona

```bash
curl -X DELETE http://localhost:8080/api/persons/1
```

---

## Obtener la edad

```bash
curl http://localhost:8080/api/persons/1/age
```


**Erwin Alberto Ramírez 7690-23-2387**

Universidad Mariano Gálvez de Guatemala

Curso: Desarrollo Web