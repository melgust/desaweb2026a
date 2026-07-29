# Práctica: Desarrollo de una API REST con PHP y almacenamiento en archivos

Previo a iniciar con la práctica dos se le solicita corregir la práctica 1. Fue un error no dejarlo en el enunciado.

Si su rama tiene la siguiente estructura

practrice1
├── css
│   └── styles.css
├── img
│   └── imgperfil.jpeg
├── index.html
├── instructions.md
├── js
│   └── script.js
└── mcalic1.html

Cree una carpeta con su usuario (UMG, para el ejemplo se usa student) y mueva los archivos de su práctica a él quedando de la siguiente manera

practrice1
├── mcalic1.html
└── student
    ├── css
    │   └── styles.css
    ├── img
    │   └── imgperfil.jpeg
    ├── index.html
    └── js
        └── script.js

## Objetivo

Desarrollar una API REST utilizando **PHP puro (sin frameworks)** para gestionar la información de personas. La información deberá almacenarse en un archivo **JSON**, por lo que **no está permitido utilizar una base de datos**.

La práctica está diseñada para completarse en **2 horas** y tiene como objetivo evaluar conocimientos de PHP, Programación Orientada a Objetos (POO), manejo de archivos, JSON, HTTP y organización del código.

---

# Investigación previa

Antes de comenzar el desarrollo de la API, investigue y comprenda los siguientes conceptos:

- **DTO (Data Transfer Object):** ¿Qué es? ¿Cuál es su propósito? ¿Qué ventajas ofrece al separar la transferencia de datos de la lógica de negocio?
- **Controller:** ¿Cuál es su responsabilidad dentro de una aplicación? ¿Qué tareas debe realizar y cuáles no?
- **Helper:** ¿Qué es un helper? ¿En qué casos es recomendable utilizarlo? ¿Qué tipo de funcionalidades suelen implementarse en esta clase?

Durante el desarrollo de la práctica:

- Utilizar un **DTO** para representar la información de una persona.
- Implementar un **Controller** para gestionar las solicitudes HTTP y coordinar las operaciones de la API.
- Implementar un **Helper** para encapsular las operaciones relacionadas con la lectura y escritura del archivo JSON.

> **Nota:** No es necesario entregar un documento con la investigación. Sin embargo, durante la revisión de la práctica se podrán realizar preguntas sobre estos conceptos para verificar su comprensión.

---

# Requisitos funcionales

La API debe permitir realizar las siguientes operaciones.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/persons` | Crear una persona |
| `GET` | `/api/persons` | Obtener todas las personas |
| `GET` | `/api/persons/{id}` | Obtener una persona por ID |
| `PUT` | `/api/persons/{id}` | Actualizar una persona |
| `DELETE` | `/api/persons/{id}` | Eliminar una persona |
| `GET` | `/api/persons/{id}/age` | Obtener la edad de una persona |

---

# DTO (Obligatorio)

Para representar la información de una persona, se debe crear un **Data Transfer Object (DTO)** llamado:

```text
PersonDTO.php
```

El DTO debe contener como mínimo los siguientes atributos:

- id
- name
- birthday
- email

Además, debe implementar:

- Constructor.
- Getters y setters para todos los atributos.
- Método `toArray()` para convertir el objeto en un arreglo asociativo.

## Ejemplo

```json
{
    "id": 1,
    "name": "Juan Pérez",
    "birthday": "1998-06-15",
    "email": "juan@email.com"
}
```

El campo **birthday** debe almacenarse utilizando el formato:

```text
YYYY-MM-DD
```

---

# Endpoints

## Crear una persona

**Método**

```text
POST
```

**Endpoint**

```text
/api/persons
```

### Body

```json
{
    "name": "Juan Pérez",
    "birthday": "1998-06-15",
    "email": "juan@email.com"
}
```

### Respuesta esperada

- Crear un identificador único.
- Guardar la información en el archivo JSON.
- Retornar el objeto creado.

---

## Obtener todas las personas

**Método**

```text
GET
```

**Endpoint**

```text
/api/persons
```

Debe devolver un arreglo JSON con todas las personas almacenadas.

---

## Obtener una persona por ID

**Método**

```text
GET
```

**Endpoint**

```text
/api/persons/{id}
```

Si la persona no existe, responder con:

```json
{
    "message": "Person not found"
}
```

---

## Actualizar una persona

**Método**

```text
PUT
```

**Endpoint**

```text
/api/persons/{id}
```

Debe permitir modificar:

- name
- birthday
- email

---

## Eliminar una persona

**Método**

```text
DELETE
```

**Endpoint**

```text
/api/persons/{id}
```

Debe eliminar el registro del archivo JSON.

---

## Obtener la edad

**Método**

```text
GET
```

**Endpoint**

```text
/api/persons/{id}/age
```

Debe calcular la edad utilizando la fecha de nacimiento (`birthday`) y devolver una respuesta similar a:

```json
{
    "id": 1,
    "name": "Juan Pérez",
    "age": 28
}
```

> **Importante:** La edad **no debe almacenarse** en el archivo JSON. Debe calcularse dinámicamente utilizando `DateTime`.

---

# Almacenamiento

Toda la información debe almacenarse en el archivo:

```text
persons.json
```

Ejemplo:

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

# Validaciones

La API debe validar como mínimo lo siguiente:

- Todos los campos son obligatorios.
- El nombre no puede estar vacío.
- El correo debe tener un formato válido.
- No se permiten correos duplicados.
- La fecha de nacimiento debe tener el formato `YYYY-MM-DD`.
- La fecha de nacimiento no puede ser una fecha futura.
- Todas las respuestas deben devolverse en formato JSON.

---

# Estructura sugerida

```text
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
└── README.md
```

La estructura puede modificarse siempre que el proyecto permanezca organizado.

---

# Requisitos técnicos

- PHP 8 o superior.
- No utilizar frameworks.
- No utilizar bases de datos.
- Utilizar exclusivamente archivos JSON como mecanismo de persistencia.
- Implementar Programación Orientada a Objetos.
- Utilizar un **DTO** para las operaciones de creación y actualización.
- Implementar un **Controller** para centralizar la lógica de los endpoints.
- Implementar un **Helper** para gestionar las operaciones de lectura y escritura del archivo JSON.
- Utilizar los códigos HTTP apropiados (`200`, `201`, `400`, `404`, etc.).

---

# Criterios de evaluación

| Criterio | Puntos |
|----------|-------:|
| Funcionamiento de los endpoints CRUD | 30 |
| Endpoint `/api/persons/{id}/age` | 15 |
| Uso correcto del DTO | 15 |
| Implementación del Controller | 10 |
| Implementación del Helper | 10 |
| Manejo de archivos JSON | 10 |
| Validaciones | 5 |
| Organización del código | 5 |

**Total: 100 puntos**

---

# Entregables

Se deberá entregar:

1. Código fuente completo en el repositorio, en su rama y carpeta con su usuario.
2. Archivo `persons.json`.
3. Archivo `README.md` con:
   - Instrucciones para ejecutar el proyecto.
   - Una breve explicación (2 o 3 párrafos) sobre qué es un **DTO**, un **Controller** y un **Helper**, indicando cómo fueron utilizados en la solución.
4. Instrucciones o comandos curl para probar los endpoints.
5. Su API debe estar corriendo en un contenedor

---

# Tiempo estimado

**Duración:** **2 horas**