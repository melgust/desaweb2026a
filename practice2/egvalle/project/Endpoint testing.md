# Comandos cURL para probar los endpoints

## 1. Obtener todas las personas

```bash
curl.exe -X GET "http://localhost:8080/api/persons"
```

**Resultado esperado:** Devuelve un arreglo con todas las personas registradas.

---

## 2. Obtener una persona por ID

```bash
curl.exe -X GET "http://localhost:8080/api/persons/1"
```

**Resultado esperado:** Devuelve la información de la persona cuyo ID es 1.

---

## 3. Crear una persona

Crear un archivo llamado `person.json` con el siguiente contenido:

```json
{
    "name": "Juan Perez",
    "birthday": "1998-06-15",
    "email": "juan@email.com"
}
```

Ejecutar el siguiente comando:

```bash
curl.exe -X POST "http://localhost:8080/api/persons" ^
-H "Content-Type: application/json" ^
--data-binary "@person.json"
```

**Resultado esperado:** Se crea un nuevo registro y la API devuelve la información de la persona con su ID asignado automáticamente.

---

## 4. Actualizar una persona

Crear un archivo llamado `update.json` con el siguiente contenido:

```json
{
    "name": "Juan Carlos Perez",
    "birthday": "1998-06-15",
    "email": "juan.carlos@email.com"
}
```

Ejecutar el siguiente comando:

```bash
curl.exe -X PUT "http://localhost:8080/api/persons/1" ^
-H "Content-Type: application/json" ^
--data-binary "@update.json"
```

**Resultado esperado:** Se actualiza la información de la persona con ID 1 y la API devuelve los datos actualizados.

---

## 5. Obtener la edad de una persona

```bash
curl.exe -X GET "http://localhost:8080/api/persons/1/age"
```

**Resultado esperado:** Devuelve el ID, el nombre y la edad calculada de la persona.

---

## 6. Eliminar una persona

```bash
curl.exe -X DELETE "http://localhost:8080/api/persons/1"
```

**Resultado esperado:** Elimina la persona con ID 1 y devuelve un mensaje confirmando que el registro fue eliminado.

---

## 7. Verificar la eliminación

```bash
curl.exe -X GET "http://localhost:8080/api/persons"
```

**Resultado esperado:** La persona eliminada ya no aparece en el listado de registros.
