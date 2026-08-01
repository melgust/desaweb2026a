# API REST con PHP

Este proyecto consiste en una API REST desarrollada en **PHP 8** utilizando únicamente **PHP puro**, sin el uso de frameworks ni bases de datos.

La información de las personas se almacena en un archivo **JSON** (`persons.json`), el cual funciona como mecanismo de persistencia de datos.

La API permite realizar operaciones CRUD sobre personas y calcular dinámicamente la edad de una persona a partir de su fecha de nacimiento.

## DTO (Data Transfer Object)

Un DTO (Data Transfer Object) es un objeto cuyo propósito es transportar información entre las diferentes capas de la aplicación sin contener lógica de negocio.

En este proyecto se implementó la clase **PersonDTO**, la cual representa una persona mediante los atributos:

- id
- name
- birthday
- email

Además, incluye constructor, getters, setters y el método `toArray()` para convertir el objeto en un arreglo antes de almacenarlo en el archivo JSON.

## Controller

El Controller es el encargado de recibir las solicitudes HTTP, validar la información recibida, coordinar las operaciones necesarias y devolver la respuesta correspondiente.

En este proyecto, **PersonController** administra todos los endpoints de la API, incluyendo:

- Crear personas
- Obtener personas
- Actualizar personas
- Eliminar personas
- Calcular la edad
- Validar los datos recibidos

## Helper

Un Helper es una clase utilizada para encapsular funcionalidades reutilizables que no pertenecen directamente a la lógica de negocio.

En este proyecto se implementó **FileManager**, cuya responsabilidad es gestionar el archivo `persons.json`, realizando operaciones de lectura y escritura de la información.


# Instalación

## Requisitos

- Docker Desktop
- Docker Compose

---

## Ejecutar el proyecto

Ubicarse en la carpeta raíz del proyecto y ejecutar:

```bash
docker compose up --build
```

La API estará disponible en:

http://localhost:8080


# Endpoints

| Método | Endpoint | Descripción |
|---------|----------|-------------|
| POST | /api/persons | Crear una persona |
| GET | /api/persons | Obtener todas las personas |
| GET | /api/persons/{id} | Obtener una persona |
| PUT | /api/persons/{id} | Actualizar una persona |
| DELETE | /api/persons/{id} | Eliminar una persona |
| GET | /api/persons/{id}/age | Obtener la edad |

---

# Ejemplos utilizando curl

## Obtener todas las personas

```bash
curl http://localhost:8080/api/persons
```

---

## Obtener una persona

```bash
curl http://localhost:8080/api/persons/1
```

## Crear una persona

```bash
curl -X POST http://localhost:8080/api/persons \
-H "Content-Type: application/json" \
-d "{\"name\":\"Juan Pérez\",\"birthday\":\"1998-06-15\",\"email\":\"juan@email.com\"}"
```

## Actualizar una persona

```bash
curl -X PUT http://localhost:8080/api/persons/1 \
-H "Content-Type: application/json" \
-d "{\"name\":\"Juan Carlos Pérez\",\"birthday\":\"1998-06-15\",\"email\":\"juan@email.com\"}"
```

## Eliminar una persona

```bash
curl -X DELETE http://localhost:8080/api/persons/1
```

## Obtener la edad

```bash
curl http://localhost:8080/api/persons/1/age
```