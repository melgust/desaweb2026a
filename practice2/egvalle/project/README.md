# Práctica 2 - API REST con PHP

## Instrucciones para ejecutar el proyecto

1. Clonar el repositorio.

```bash
git clone egvalle-umg
```

2. Ingresar a la carpeta del proyecto.

```bash
cd /practice2/egvalle/project
```

3. Construir e iniciar los contenedores con Docker.

```bash
docker compose up --build
```

4. Una vez iniciado el contenedor, la API estará disponible en:

```text
http://localhost:8080
```

---

## Explicación de la arquitectura utilizada

### DTO (Data Transfer Object)

Un **DTO (Data Transfer Object)** es una clase cuyo propósito es transportar datos entre las diferentes capas de una aplicación sin incluir lógica de negocio. En este proyecto se implementó la clase `PersonDTO`, la cual representa a una persona mediante los atributos `id`, `name`, `birthday` y `email`. Además, cuenta con su constructor, métodos *getter* y *setter*, y un método `toArray()` para facilitar la conversión del objeto a un arreglo antes de almacenarlo en el archivo JSON.

### Controller

El **Controller** es el encargado de recibir las solicitudes HTTP, procesar la información enviada por el cliente, realizar las validaciones necesarias y coordinar las operaciones de la aplicación. En esta solución se implementó `PersonController`, responsable de gestionar los endpoints de la API para consultar, crear, actualizar, eliminar personas y calcular la edad de una persona. También se encarga de generar las respuestas en formato JSON junto con los códigos de estado HTTP correspondientes.

### Helper

Un **Helper** es una clase de apoyo que concentra funcionalidades reutilizables para evitar duplicar código. En este proyecto se desarrolló `FileManager`, cuya responsabilidad es administrar el archivo `persons.json`, realizando la lectura, escritura, búsqueda, actualización y eliminación de registros. De esta manera, el controlador no interactúa directamente con el archivo, manteniendo una mejor separación de responsabilidades y una arquitectura más organizada.
