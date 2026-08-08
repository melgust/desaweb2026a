# Emmanuel Herrera - Desarrollo Web - A - Jornada Sabatina

API REST desarrollada en PHP puro (sin frameworks), con Programación Orientada
a Objetos, que gestiona personas y almacena la información en un archivo
JSON (`data/persons.json`).

## Instrucciones para ejecutar el proyecto

### Servidor PHP 

Por compatibilidad creo que es necesario PHP 8 o superior sino puede dar problemas.

```bash
php -S 0.0.0.0:8000 router.php
```

## Estructura del proyecto

```
api-persons/
├── api/
│   └── index.php          # Router para el API
├── controllers/
│   └── PersonController.php
├── dto/
│   └── PersonDTO.php
├── helpers/
│   └── FileManager.php
├── data/
│   └── persons.json
├── router.php              # Router para el server PHP
├── Dockerfile
└── README.md
```

## Que es un DTO

Este lo que hace es que transporta datos entre las capas de la app. Lo que lo hace bastante util por la forma en que desacopla los datos entre ellos, otro punto importante es como maneja las reglas que gobiernan esos datos sin que afecten al resto del sistema. Para este caso se uso para identificar ciertos campos como los: id, name, birthday, email, ademas de tener en vista los gets y sets y el método array para el reconocimiento del JSON.

## Que es un Controller

Su función es la de recibir las solicitudes HTTP, recibir de manera correcta el método y la ruta, que llegue a la etapa de validación y devolver una respuesta con un codigo de status. Para aqui se uso el PersonController que centraliza los endpoints de la API: valida el input, arma los PersonDTO, que esta es de lo mas importante para esta situacion puntual, y por lo que investigue el FileManager tambien lo es y es el que lee o escriba el archivo JSON.

## Que es un Helper

Por lo que entendi, considero que se le puede llamar como una clase de apoyo que funge como funcion especifica y de varios usos, en este caso hace mucho match para el acceso a archivos y el format para datos. Aqui hizo de puente para que ni el DTO ni el Controller acceden al archivo directamente y que calcule el siguiente ID disponible.

## Endpoint y ejemplo como CRUD

### Crear una persona

```bash
curl -X POST http://localhost:8000/api/persons \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Emmanuel Herrera",
    "birthday": "1997-06-27",
    "email": "hola@email.com"
  }'
```

### Obtener todas las personas

```bash
curl http://localhost:8000/api/persons
```

### Obtener una persona por ID

```bash
curl http://localhost:8000/api/persons/1
```

### Actualizar una persona

```bash
curl -X PUT http://localhost:8000/api/persons/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Emmanuel Herrera Actualizado",
    "birthday": "1997-06-27",
    "email": "newhola@email.com"
  }'
```

### Eliminar una persona

```bash
curl -X DELETE http://localhost:8000/api/persons/1
```

### Obtener la edad de una persona

```bash
curl http://localhost:8000/api/persons/1/age
```

## Menciones oportunas

- Todos los campos (name, birthday, email) son obligatorios.
- Para el name, solo tiene que estar lleno  
- email debe de llevar @ y como nos sirve de ID no puede estar duplicado.
- birthday esta orientado para que vaya de año hasta dia año-mes-dia
