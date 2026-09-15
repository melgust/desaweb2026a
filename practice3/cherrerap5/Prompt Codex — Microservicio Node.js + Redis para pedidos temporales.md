# Objetivo

Trabaja sobre el siguiente proyecto y específicamente sobre la rama y carpeta indicadas:

Repositorio:

https://github.com/melgust/desaweb2026a

Rama:

`cherrerap5`

Directorio principal:

`practice3/cherrerap5`

Antes de modificar código, analiza completamente la arquitectura existente, las convenciones, componentes Angular, servicios HTTP, autenticación, modelos, Docker Compose y los microservicios existentes.

La aplicación actualmente está compuesta principalmente por:

- Angular como frontend.
- Backend .NET para autenticación y facturas.
- MySQL como persistencia del backend .NET.
- Spring Boot + MongoDB como microservicio de catálogo.
- Productos, categorías y proveedores pertenecen al `catalog-service`.
- Docker Compose coordina los servicios.

La tarea consiste en agregar un nuevo microservicio especializado en la gestión temporal de pedidos/carritos utilizando:

- Node.js
- TypeScript
- Express
- Redis

El microservicio debe integrarse correctamente con la arquitectura existente y con el frontend Angular.

---

# 1. Crear nuevo microservicio

Crear dentro de:

`practice3/cherrerap5/`

un nuevo proyecto:

```text
order-service/
```

Este servicio será responsable de administrar pedidos temporales antes de que estos se conviertan en una factura/pedido definitivo.

Usar preferentemente:

- Node.js 20+
- TypeScript
- Express
- Redis
- `redis` oficial de Node.js
- Zod, Joi o mecanismo equivalente para validación
- ESLint
- Docker

No utilizar Redis únicamente como caché secundaria: Redis debe ser la fuente de verdad para los pedidos temporales.

---

# 2. Concepto del pedido temporal

Cuando el usuario vaya agregando productos a un pedido/carrito, mantener la información en Redis.

Cada pedido temporal deberá tener un identificador único, preferiblemente UUID.

Ejemplo conceptual de key:

```text
order:draft:{userId}
```

o:

```text
order:draft:{orderId}
```

Selecciona la estrategia que mejor encaje con la autenticación existente.

La información puede almacenarse como JSON.

Ejemplo conceptual:

```json
{
  "id": "uuid",
  "userId": "123",
  "status": "DRAFT",
  "createdAt": "2026-09-14T20:00:00Z",
  "updatedAt": "2026-09-14T20:30:00Z",
  "items": [
    {
      "productId": "mongo-product-id",
      "productName": "Laptop",
      "supplierId": "mongo-supplier-id",
      "supplierName": "Proveedor X",
      "quantity": 2,
      "unitPrice": 4500,
      "subtotal": 9000
    }
  ],
  "subtotal": 9000,
  "total": 9000
}
```

Adapta el modelo a las estructuras reales del proyecto.

No inventes campos innecesarios si el proyecto ya tiene contratos equivalentes.

---

# 3. TTL obligatorio de 1 día

Todo pedido temporal almacenado en Redis debe tener:

```text
TTL = 86400 segundos
```

equivalente a:

```text
24 horas
```

El TTL debe aplicarse utilizando las capacidades nativas de Redis.

Ejemplo conceptual:

```text
SET key value EX 86400
```

o equivalente utilizando el cliente Redis de Node.js.

No implementar un cron job para eliminar pedidos expirados.

Redis debe encargarse automáticamente de eliminarlos mediante TTL.

---

# 4. Regla de expiración

El requerimiento principal es:

> Un pedido temporal debe existir como máximo durante un día si el usuario no genera/confirma el pedido.

Cuando el usuario agrega el primer producto:

- crear el pedido;
- asignar TTL de 24 horas.

Cuando agregue, actualice o elimine productos:

- mantener correctamente los datos del pedido;
- conservar la política de expiración.

Define una política clara respecto del TTL.

Preferentemente:

**el TTL debe contar desde la última modificación del pedido**, de modo que cualquier actividad válida renueve las 24 horas.

Por ejemplo:

```text
Usuario crea carrito -> TTL 24h
Usuario modifica carrito 3h después -> TTL vuelve a 24h
Usuario no vuelve a modificarlo -> Redis lo elimina 24h después
```

Documentar esta decisión.

---

# 5. Confirmación del pedido

Cuando el usuario finalmente genere/confirme el pedido:

1. recuperar el pedido temporal de Redis;
2. validar que todavía exista;
3. validar que tenga productos;
4. procesar la creación del registro definitivo utilizando el backend que corresponda;
5. si la operación definitiva termina correctamente, eliminar inmediatamente el pedido temporal de Redis;
6. no esperar a que venza el TTL.

Conceptualmente:

```text
Redis Draft Order
       |
       v
Confirmar pedido
       |
       v
Persistencia definitiva
       |
       v
DEL order:draft:{id}
```

Si falla la creación definitiva:

- NO eliminar el pedido temporal;
- devolver el error apropiado;
- permitir que el usuario vuelva a intentarlo mientras el TTL siga vigente.

---

# 6. Integración con el flujo existente de facturas

Analiza primero el funcionamiento actual de:

```text
backend/
frontend/src/app/features/invoices/
```

Actualmente el backend .NET mantiene las facturas.

No dupliques las facturas dentro de Redis.

Redis únicamente representa el pedido/carrito temporal antes de confirmar la operación.

Al confirmar el carrito, integra el flujo con el mecanismo actual utilizado para crear una factura.

Evita duplicar lógica de negocio.

Si el backend .NET necesita recibir información proveniente del `order-service`, implementa el contrato HTTP correspondiente.

Decide y documenta qué componente debe orquestar la creación final.

Preferiblemente:

```text
Angular
   |
   v
Order Service
   |
   +----> Redis
   |
   +----> Backend .NET -> MySQL
```

siempre que esto no rompa las responsabilidades actuales.

---

# 7. Comunicación con Catalog Service

Los datos definitivos de:

- productos;
- categorías;
- proveedores;

pertenecen al:

```text
catalog-service
```

No dupliques estos mantenimientos en Node.js.

Cuando sea necesario validar productos o proveedores, reutiliza el `catalog-service`.

Utilizar dentro de Docker:

```text
http://catalog-service:8080
```

y desde host/desarrollo:

```text
http://localhost:8080
```

La URL debe configurarse mediante variables de entorno.

---

# 8. API REST del Order Service

Implementar como mínimo endpoints equivalentes a:

```text
GET    /api/orders/current
POST   /api/orders/items
PUT    /api/orders/items/:productId
DELETE /api/orders/items/:productId
DELETE /api/orders/current
POST   /api/orders/confirm
```

Los nombres pueden adaptarse si existe una convención mejor en el proyecto.

## GET /api/orders/current

Debe devolver el pedido temporal actual.

Si no existe porque:

- nunca se creó;
- fue confirmado;
- venció el TTL;

responder apropiadamente, preferentemente con:

```text
404 Not Found
```

o un contrato consistente con el frontend.

---

## POST /api/orders/items

Agregar un producto al carrito.

Debe validar:

- producto existente;
- cantidad > 0;
- identificadores válidos;
- usuario autenticado.

Si el producto ya existe en el carrito:

- incrementar cantidad;

o actualizarlo siguiendo una decisión coherente y documentada.

---

## PUT /api/orders/items/:productId

Modificar la cantidad.

Si la cantidad termina siendo 0, puede eliminarse el item o rechazarse la operación.

Escoge una regla clara y mantenla consistente.

---

## DELETE /api/orders/items/:productId

Eliminar únicamente ese producto.

Recalcular:

- subtotal;
- total;
- cantidades.

---

## DELETE /api/orders/current

Vaciar/cancelar completamente el pedido temporal.

Eliminar inmediatamente su key de Redis.

---

## POST /api/orders/confirm

Confirmar el pedido.

Debe:

- obtener el draft;
- verificar existencia;
- validar productos;
- crear el registro definitivo correspondiente;
- borrar el draft solamente cuando la operación definitiva sea exitosa.

---

# 9. Endpoint de salud

Agregar:

```text
GET /health
```

Respuesta esperada aproximada:

```json
{
  "status": "UP",
  "redis": "UP"
}
```

Debe comprobar realmente la conexión con Redis mediante `PING`.

Si Redis no está disponible, el healthcheck debe reportarlo correctamente.

---

# 10. Manejo del usuario

No crear carritos anónimos arbitrariamente si el proyecto ya utiliza JWT.

Analiza el sistema de autenticación actual.

El pedido debe quedar asociado al usuario autenticado.

Por ejemplo:

```text
order:draft:user:{userId}
```

Esto permitirá tener como máximo un carrito activo por usuario.

No confiar en un `userId` enviado libremente por el frontend si el JWT ya proporciona la identidad.

Extraer la identidad desde el token siempre que sea posible.

---

# 11. Autenticación

Reutilizar el JWT generado actualmente por el backend .NET.

El nuevo microservicio debe validar el token antes de permitir las operaciones de pedidos.

No implementar un segundo login.

Flujo esperado:

```text
Angular
   |
   | login
   v
.NET Auth
   |
   | JWT
   v
Angular
   |
   +----> .NET
   +----> Catalog Service
   +----> Order Service
```

Configura mediante variables de entorno lo necesario para validar JWT.

No hardcodear secretos.

---

# 12. Estructura del microservicio

Utiliza una estructura mantenible.

Ejemplo:

```text
order-service/
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   └── redis.ts
│   ├── controllers/
│   │   └── order.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── models/
│   │   └── order.ts
│   ├── routes/
│   │   ├── order.routes.ts
│   │   └── health.routes.ts
│   ├── services/
│   │   ├── order.service.ts
│   │   ├── redis-order.repository.ts
│   │   ├── catalog.client.ts
│   │   └── invoice.client.ts
│   ├── validators/
│   ├── app.ts
│   └── server.ts
├── tests/
├── .dockerignore
├── .env.example
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

Puedes adaptar nombres si encuentras una arquitectura mejor.

Mantén separación entre:

- HTTP;
- lógica de negocio;
- Redis;
- integración con otros servicios.

---

# 13. Redis

Agregar Redis al `docker-compose.yml` raíz.

Ejemplo conceptual:

```yaml
redis:
  image: redis:7-alpine
  container_name: enterprise_redis
  restart: always
  command: redis-server --appendonly yes
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
  networks:
    - enterprise_network
```

Agregar:

```yaml
redis_data:
```

a los volúmenes si decides utilizar persistencia.

---

# 14. Dockerizar Order Service

Agregar el nuevo servicio al Docker Compose.

Ejemplo conceptual:

```yaml
order-service:
  build:
    context: ./order-service
    dockerfile: Dockerfile
  container_name: enterprise_order_service
  restart: always
  ports:
    - "3000:3000"
  environment:
    PORT: 3000
    REDIS_URL: redis://redis:6379
    ORDER_TTL_SECONDS: 86400
    CATALOG_SERVICE_URL: http://catalog-service:8080
    BACKEND_SERVICE_URL: http://backend
  depends_on:
    redis:
      condition: service_healthy
    catalog-service:
      condition: service_healthy
    backend:
      condition: service_started
  networks:
    - enterprise_network
```

Ajustar URLs y puertos según la implementación final.

---

# 15. Frontend Angular

Modificar las vistas necesarias para soportar el flujo de pedido/carrito.

Actualmente existen features para:

```text
auth
invoices
products
suppliers
```

Crear un nuevo feature:

```text
frontend/src/app/features/orders/
```

o:

```text
frontend/src/app/features/cart/
```

Selecciona el nombre más coherente y úsalo consistentemente.

---

# 16. Servicio Angular para pedidos

Crear un servicio HTTP equivalente a:

```text
OrderService
```

con operaciones:

```typescript
getCurrentOrder()
addItem()
updateItem()
removeItem()
clearOrder()
confirmOrder()
```

No realizar llamadas HTTP directamente desde los componentes si el proyecto utiliza services.

---

# 17. Modificar vista de productos

En el listado/mantenimiento actual de productos, agregar una acción similar a:

```text
Agregar al pedido
```

o:

```text
Agregar al carrito
```

Permitir seleccionar cantidad.

No modificar las funciones administrativas existentes de productos.

La acción de carrito debe coexistir con:

- crear;
- editar;
- eliminar;
- listar.

cuando corresponda según rol.

---

# 18. Crear vista del carrito

Crear una vista accesible mediante una ruta similar a:

```text
/orders
```

o:

```text
/cart
```

Debe mostrar:

- producto;
- proveedor si corresponde;
- precio unitario;
- cantidad;
- subtotal por línea;
- subtotal general;
- total;
- acción para modificar cantidad;
- acción para eliminar producto;
- acción para vaciar carrito;
- acción para confirmar/generar pedido.

---

# 19. Mostrar expiración

El usuario debe poder comprender que el pedido es temporal.

Mostrar un mensaje como:

```text
Este pedido se conservará durante 24 horas desde su última modificación.
```

No es obligatorio implementar un contador en tiempo real.

Sin embargo, si el backend devuelve:

```text
expiresAt
```

o:

```text
ttlSeconds
```

mostrar información amigable.

Ejemplo:

```text
El pedido expira aproximadamente en 23 h 42 min.
```

No calcular la expiración únicamente en frontend.

Redis/order-service debe continuar siendo la fuente de verdad.

---

# 20. Manejar pedido expirado

El frontend debe manejar correctamente el caso:

```text
404
```

del Order Service.

Si el carrito expiró:

- mostrar carrito vacío;
- no dejar información vieja en pantalla;
- mostrar mensaje como:

```text
Tu pedido temporal expiró después de 24 horas de inactividad.
```

---

# 21. Confirmación

Antes de generar el pedido/factura, mostrar confirmación.

Ejemplo:

```text
¿Deseas confirmar este pedido?
```

Al confirmar exitosamente:

- limpiar el estado del carrito en Angular;
- navegar a la factura/pedido generado;
- mostrar mensaje de éxito.

No eliminar visualmente el carrito antes de recibir respuesta exitosa del backend.

---

# 22. Navegación

Modificar el menú principal para agregar:

```text
Pedidos
```

o:

```text
Carrito
```

Idealmente mostrar cantidad de productos:

```text
Carrito (3)
```

si la arquitectura existente lo permite sin agregar complejidad innecesaria.

Mantener las rutas existentes.

---

# 23. Mantenimientos necesarios

Realiza también todos los mantenimientos necesarios para que la nueva funcionalidad quede completamente integrada.

Esto incluye revisar y modificar cuando corresponda:

- rutas Angular;
- interfaces/modelos TypeScript;
- servicios Angular;
- interceptores;
- manejo del JWT;
- CORS;
- variables de entorno;
- Docker Compose;
- Nginx;
- README;
- documentación;
- healthchecks;
- navegación;
- contratos HTTP;
- manejo global de errores.

No dejar código muerto ni implementaciones anteriores incompatibles.

---

# 24. No mover responsabilidades existentes

Mantener la separación:

```text
.NET + MySQL
Authentication
Invoices
```

```text
Spring Boot + MongoDB
Categories
Products
Suppliers
```

```text
Node.js + Redis
Temporary Orders / Cart
```

Redis no debe convertirse en una base permanente de facturas.

MongoDB no debe almacenar carritos.

MySQL no debe almacenar drafts temporales salvo que exista una razón técnica imprescindible.

---

# 25. Flujo final esperado

La arquitectura debe quedar conceptualmente así:

```text
                         +----------------+
                         | Angular        |
                         +-------+--------+
                                 |
         +-----------------------+-----------------------+
         |                       |                       |
         v                       v                       v
+----------------+      +-------------------+    +-------------------+
| .NET Backend   |      | Catalog Service   |    | Order Service     |
| Auth/Invoices  |      | Spring + MongoDB  |    | Node.js + Redis   |
+-------+--------+      +---------+---------+    +---------+---------+
        |                         |                        |
        v                         v                        v
     MySQL                     MongoDB                   Redis
```

Flujo funcional:

```text
Login
  |
  v
Productos
  |
  v
Agregar producto
  |
  v
Order Service
  |
  v
Redis
TTL = 24 horas
  |
  +--------------------------+
  |                          |
Usuario abandona        Usuario confirma
  |                          |
  v                          v
24h sin actividad       Crear factura/pedido
  |                          |
  v                          v
Redis elimina           Backend .NET
automáticamente              |
                             v
                           MySQL
                             |
                             v
                     Order Service elimina
                     draft de Redis
```

---

# 26. Casos límite

Implementar correctamente como mínimo:

### Producto duplicado

Agregar el mismo producto dos veces no debe crear filas duplicadas innecesarias.

Actualizar cantidad.

### Cantidad inválida

Rechazar:

```text
0
-1
-10
NaN
```

### Producto inexistente

No agregar.

### Producto eliminado después de agregarlo al carrito

Al confirmar el pedido, volver a validar contra Catalog Service si corresponde.

Si ya no es válido, informar qué producto impide confirmar.

### Redis caído

Responder:

```text
503 Service Unavailable
```

o equivalente.

No fingir que el carrito fue guardado.

### Pedido expirado

Responder de forma consistente y frontend debe mostrar carrito vacío.

### Confirmación fallida

No borrar el carrito.

### Confirmación exitosa

Borrar inmediatamente el carrito.

### Usuario A / Usuario B

Nunca compartir carrito.

---

# 27. Seguridad

No aceptar arbitrariamente desde el frontend:

```text
userId
role
total
subtotal
```

si estos valores pueden derivarse de información confiable.

El servidor debe recalcular:

```text
subtotal
total
```

No confiar en montos manipulables enviados desde Angular.

Validar la identidad desde JWT.

---

# 28. Pruebas

Agregar pruebas para el nuevo microservicio.

Como mínimo comprobar:

1. creación del carrito;
2. TTL = 86400;
3. lectura del carrito;
4. agregar producto;
5. incrementar producto existente;
6. actualizar cantidad;
7. eliminar item;
8. vaciar carrito;
9. aislamiento por usuario;
10. confirmación exitosa;
11. eliminación de Redis después de confirmar;
12. no eliminar Redis si confirmación falla;
13. carrito expirado;
14. cantidad inválida;
15. producto inexistente;
16. Redis no disponible;
17. JWT inválido.

Evitar pruebas que requieran necesariamente infraestructura externa cuando sea posible.

Crear abstracciones/mocks apropiados para Redis y clientes HTTP.

---

# 29. Documentación

Actualizar:

```text
practice3/cherrerap5/README.md
```

Agregar el nuevo componente a la arquitectura.

Debe quedar documentado:

```text
Order Service — Node.js / TypeScript
Redis
TTL 24 horas
```

Agregar tabla de puertos.

Por ejemplo:

```text
Order Service: localhost:3000
Redis: localhost:6379
```

Agregar endpoints.

Agregar instrucciones de ejecución.

Agregar explicación del TTL.

Agregar ejemplo de pruebas.

---

# 30. .env.example

Crear:

```text
order-service/.env.example
```

Ejemplo:

```env
PORT=3000
REDIS_URL=redis://localhost:6379
ORDER_TTL_SECONDS=86400
CATALOG_SERVICE_URL=http://localhost:8080
BACKEND_SERVICE_URL=http://localhost:5000
JWT_SECRET=
CORS_ALLOWED_ORIGINS=http://localhost:4200,http://localhost:81
```

No subir secretos reales.

---

# 31. Validación Docker

El proyecto completo debe poder ejecutarse desde:

```bash
cd practice3/cherrerap5
docker compose up -d --build
```

y verificar:

```bash
docker compose ps
```

Todos los servicios deben iniciar correctamente.

Validar también:

```bash
docker compose config
```

---

# 32. Validación funcional final

Realiza una prueba conceptual o automática del siguiente escenario:

```text
1. Login
2. Abrir productos
3. Agregar producto A x2
4. Agregar producto B x1
5. Abrir carrito
6. Verificar cantidades y totales
7. Consultar Redis y confirmar TTL cercano a 86400
8. Modificar cantidad
9. Verificar renovación del TTL
10. Confirmar pedido
11. Verificar creación definitiva
12. Verificar que la key ya no existe en Redis
```

También comprobar:

```text
1. Crear otro carrito
2. No confirmarlo
3. Verificar que tiene TTL
```

No es necesario esperar literalmente 24 horas en pruebas automatizadas.

Configura el TTL mediante variable de entorno para los tests, por ejemplo:

```text
ORDER_TTL_SECONDS=5
```

y comprueba que Redis elimine el registro.

En producción/desarrollo normal debe seguir siendo:

```text
86400
```

---

# 33. Calidad

No quiero una solución mínima que únicamente funcione.

Quiero una integración consistente con el proyecto existente.

Aplicar:

- separación de responsabilidades;
- DTOs/interfaces;
- manejo centralizado de errores;
- configuración mediante environment;
- logs útiles;
- async/await;
- validaciones;
- status HTTP correctos;
- TypeScript estricto;
- nombres descriptivos;
- evitar `any`;
- evitar lógica duplicada;
- evitar código muerto;
- evitar URLs hardcodeadas.

---

# 34. Compatibilidad

Antes de cambiar archivos existentes:

1. revisa cómo funcionan actualmente;
2. conserva la funcionalidad que ya existe;
3. adapta la implementación a los patrones existentes.

No reescribas módulos que no estén relacionados con el requerimiento.

No cambies tecnologías existentes.

No migres el catálogo a Node.js.

No migres facturas fuera de .NET.

---

# 35. Entrega

Al finalizar:

1. Implementa todos los cambios necesarios.
2. Ejecuta las pruebas disponibles.
3. Ejecuta tests del nuevo `order-service`.
4. Ejecuta build Angular.
5. Ejecuta build de los demás servicios afectados.
6. Ejecuta:

```bash
docker compose config
```

7. Corrige errores encontrados.
8. Actualiza README.
9. Entrega un resumen de archivos creados/modificados.

El resumen final debe tener esta estructura:

```text
## Arquitectura implementada

## Archivos creados

## Archivos modificados

## API Order Service

## Integración con Redis

## TTL y expiración

## Integración Angular

## Integración con facturas

## Docker

## Pruebas realizadas

## Cómo ejecutar

## Decisiones técnicas importantes
```

No te limites a indicarme qué tendría que modificar.

Realiza efectivamente los cambios dentro de:

`practice3/cherrerap5`.