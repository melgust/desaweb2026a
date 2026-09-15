# Implementación de facturación multiproducto y carrito de compras con Node.js + Redis

Trabaja exclusivamente sobre el siguiente proyecto y rama:

Repositorio:

`https://github.com/melgust/desaweb2026a`

Rama:

`eramirez-umg`

Directorio objetivo:

`practice3/eramirez-umg`

Antes de modificar código, analiza completamente la arquitectura actual del proyecto, incluyendo:

- `backend/`
- `backend/src/Api`
- `backend/src/Application`
- `backend/src/Domain`
- `backend/src/Infrastructure`
- `catalog-service/`
- `frontend/`
- `frontend/src/app/core`
- `frontend/src/app/features/invoices`
- `frontend/src/app/features/products`
- `frontend/src/app/features/suppliers`
- `docker-compose.yml`
- configuración de Nginx
- variables de entorno
- modelos y servicios Angular existentes
- migraciones y configuración de Entity Framework
- contratos utilizados actualmente por facturación y productos

No reconstruyas innecesariamente componentes existentes. Reutiliza la arquitectura, convenciones, estilos y patrones ya presentes.

---

# OBJETIVO GENERAL

Modificar el sistema para implementar un flujo completo de compra/facturación donde:

1. Una factura pueda contener **uno o varios productos**.
2. Exista un **carrito de compras persistido temporalmente en Redis**.
3. El carrito sea administrado mediante un nuevo microservicio independiente desarrollado en **Node.js**.
4. El frontend Angular utilice este carrito durante la creación de una factura.
5. Al confirmar la factura:
   - se obtengan todos los productos del carrito;
   - se genere una factura con sus respectivos detalles;
   - se calculen subtotal, impuestos y total;
   - se persista la factura definitivamente;
   - se elimine el carrito de Redis únicamente después de confirmar exitosamente la operación.
6. Todo el ecosistema pueda ejecutarse mediante `docker compose`.

---

# RESTRICCIÓN IMPORTANTE

## NO crear pruebas unitarias

Para esta implementación:

- NO crear proyectos de testing.
- NO crear archivos `.spec.ts`.
- NO crear archivos Jest.
- NO crear archivos xUnit.
- NO agregar Moq.
- NO agregar NUnit.
- NO agregar pruebas unitarias del microservicio Node.js.
- NO agregar pruebas unitarias del frontend.
- NO agregar pruebas unitarias del backend .NET.

Puedes ejecutar compilaciones, validaciones manuales, requests HTTP y pruebas de integración manuales para verificar que la solución funciona, pero **no debes generar testing unitario automatizado**.

---

# FASE 1 — ANALIZAR LA IMPLEMENTACIÓN ACTUAL

Antes de escribir código, identifica:

- cómo se persiste actualmente `Invoice`;
- cómo funciona `InvoiceService`;
- controladores relacionados;
- DTOs de facturación;
- repositorios;
- Entity Framework;
- `DbContext`;
- migraciones;
- cómo se obtiene actualmente un producto;
- cómo funciona `catalog-service`;
- estructura del modelo `Product`;
- servicio Angular `product.service.ts`;
- servicio Angular `invoice.service.ts`;
- formulario `invoice-form.component.ts`;
- listado de facturas;
- configuración de API URLs;
- autenticación/autorización existente;
- interceptores Angular;
- Docker Compose;
- configuración Nginx.

No asumas nombres de archivos o propiedades que no existan.

Adapta la implementación a lo que realmente encuentres.

---

# FASE 2 — MODIFICAR EL MODELO DE FACTURACIÓN

Actualmente `Invoice` representa únicamente el encabezado de la factura.

Modificar el backend .NET para soportar una relación:

```text
Invoice
   |
   | 1:N
   |
InvoiceDetail
```

Crear una entidad equivalente a:

```csharp
InvoiceDetail
{
    Id
    InvoiceId
    ProductId
    ProductName
    Quantity
    UnitPrice
    Subtotal
}
```

Los nombres definitivos deben respetar las convenciones actuales del proyecto.

## Requisitos de InvoiceDetail

Cada línea de factura debe almacenar como mínimo:

- identificador;
- identificador de factura;
- identificador de producto;
- nombre/descripción del producto;
- cantidad;
- precio unitario utilizado al momento de facturar;
- subtotal de la línea.

Considerar guardar un snapshot básico del producto para evitar que cambios posteriores de nombre/precio modifiquen conceptualmente facturas históricas.

No guardar únicamente referencias que hagan imposible reconstruir posteriormente la factura.

---

# FASE 3 — RELACIÓN INVOICE → DETAILS

Modificar `Invoice` para contener su colección de detalles.

Conceptualmente:

```csharp
public ICollection<InvoiceDetail> Details { get; set; }
```

Configurar correctamente Entity Framework:

```text
Invoice
1 ---- N
InvoiceDetail
```

Configurar:

- primary key;
- foreign key;
- delete behavior apropiado;
- tipos decimal con precisión adecuada;
- índices que tengan sentido;
- restricciones de cantidad;
- relaciones de navegación.

---

# FASE 4 — MIGRACIÓN DE BASE DE DATOS

Crear la migración necesaria.

La migración debe crear la tabla correspondiente al detalle de factura.

Ejemplo conceptual:

```text
Invoices
--------
Id
SupplierId
Number
IssueDate
DueDate
Subtotal
Tax
Total
Status
Notes
...

InvoiceDetails
--------------
Id
InvoiceId
ProductId
ProductName
Quantity
UnitPrice
Subtotal
```

No eliminar información histórica existente.

La migración debe ser compatible con MySQL, ya utilizado por el proyecto.

---

# FASE 5 — CÁLCULOS DE FACTURA

El frontend NO debe ser la autoridad final para los montos.

El backend debe recalcular:

```text
lineSubtotal = quantity * unitPrice
```

Luego:

```text
invoiceSubtotal = SUM(lineSubtotal)
```

Después:

```text
tax = cálculo correspondiente
```

Finalmente:

```text
total = invoiceSubtotal + tax
```

Si actualmente existe una regla definida para impuestos, reutilizarla.

Si actualmente solo se almacena el impuesto como monto, mantener compatibilidad con el comportamiento existente evitando cálculos duplicados.

Nunca confiar en un `Total` enviado directamente por el navegador.

---

# FASE 6 — DTO DE CREACIÓN DE FACTURA

Modificar el contrato utilizado para crear una factura.

La solicitud debe soportar múltiples productos.

Ejemplo conceptual:

```json
{
  "supplierId": "guid",
  "number": "FAC-001",
  "issueDate": "2026-09-15",
  "dueDate": "2026-09-30",
  "status": "Pending",
  "notes": "...",
  "items": [
    {
      "productId": "product-1",
      "quantity": 2
    },
    {
      "productId": "product-2",
      "quantity": 3
    }
  ]
}
```

No es obligatorio utilizar exactamente este formato si la arquitectura actual justifica otro, pero una factura debe aceptar una colección de productos.

---

# FASE 7 — VALIDACIONES DE FACTURACIÓN

Validar como mínimo:

- existe proveedor;
- existe al menos un producto;
- cantidad > 0;
- producto existente;
- producto activo;
- precio válido;
- factura con número válido;
- evitar detalles duplicados innecesarios.

Si un mismo producto aparece varias veces, preferentemente consolidarlo:

```text
Producto A x2
+
Producto A x3

= Producto A x5
```

---

# FASE 8 — NUEVO MICROSERVICIO NODE.JS

Crear dentro de:

```text
practice3/eramirez-umg/
```

un nuevo microservicio llamado preferentemente:

```text
cart-service/
```

Debe ser completamente independiente del backend .NET y de `catalog-service`.

Tecnologías:

- Node.js
- Express
- Redis
- Docker
- JavaScript o TypeScript

Si utilizas TypeScript, dejar correctamente configurado:

- `tsconfig.json`;
- scripts;
- build;
- start.

No agregar tecnologías innecesarias.

---

# FASE 9 — ESTRUCTURA DEL CART-SERVICE

Usar una arquitectura clara y mantenible.

Ejemplo:

```text
cart-service/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── models/
│   ├── config/
│   ├── middleware/
│   └── app.*
├── package.json
├── Dockerfile
├── .dockerignore
└── .env.example
```

Ajustarla si existe una convención mejor dentro del repositorio.

---

# FASE 10 — REDIS

El carrito debe almacenarse en Redis.

Agregar Redis al `docker-compose.yml`.

Por ejemplo:

```yaml
redis:
  image: redis:7-alpine
```

Configurar:

- volumen si resulta conveniente;
- healthcheck;
- red `enterprise_network`;
- dependencia del `cart-service`.

No usar `localhost` para comunicación entre contenedores.

El `cart-service` deberá conectarse utilizando el hostname Docker:

```text
redis
```

---

# FASE 11 — IDENTIFICACIÓN DEL CARRITO

Cada carrito debe tener un identificador.

Preferentemente utilizar el usuario autenticado si el JWT actual permite identificarlo.

Ejemplo:

```text
cart:{userId}
```

Si por la arquitectura actual no puede obtenerse el usuario de forma consistente, implementar un `cartId` generado y enviado por el frontend.

No crear un carrito global compartido por todos los usuarios.

---

# FASE 12 — TTL DEL CARRITO

Los carritos deben ser temporales.

Configurar:

```text
TTL = 24 horas
```

equivalente a:

```text
86400 segundos
```

Cada operación significativa de modificación puede renovar el TTL para representar actividad reciente.

Cuando expire el TTL, Redis deberá eliminar automáticamente el carrito.

---

# FASE 13 — MODELO DEL CARRITO

Un carrito debe contener una colección similar a:

```json
{
  "cartId": "...",
  "items": [
    {
      "productId": "...",
      "name": "...",
      "quantity": 2,
      "unitPrice": 25,
      "subtotal": 50
    }
  ],
  "subtotal": 50,
  "updatedAt": "..."
}
```

El modelo definitivo deberá ajustarse al modelo Product existente.

---

# FASE 14 — API DEL CART-SERVICE

Implementar una API REST coherente.

Como mínimo:

```text
GET    /api/cart/:cartId
POST   /api/cart/:cartId/items
PUT    /api/cart/:cartId/items/:productId
DELETE /api/cart/:cartId/items/:productId
DELETE /api/cart/:cartId
```

Opcionalmente:

```text
POST /api/cart/:cartId/clear
```

Agregar:

```text
GET /health
```

para healthcheck Docker.

---

# FASE 15 — AGREGAR PRODUCTOS

Ejemplo:

```http
POST /api/cart/:cartId/items
```

Body:

```json
{
  "productId": "...",
  "quantity": 2
}
```

El servicio debe:

1. validar `productId`;
2. validar `quantity > 0`;
3. obtener los datos necesarios del producto;
4. agregarlo al carrito;
5. si ya existe, actualizar/acumular la cantidad;
6. recalcular subtotales;
7. persistir el carrito en Redis;
8. renovar TTL.

---

# FASE 16 — INTEGRACIÓN CON PRODUCTOS

Actualmente existe un `catalog-service`.

Analiza sus endpoints reales.

El `cart-service` debe obtener del catálogo al menos:

- ProductId;
- Name;
- Price;
- IsActive, si existe.

No confíes en el precio enviado por Angular.

El precio debe provenir de una fuente backend confiable.

Preferentemente:

```text
cart-service
     |
     HTTP
     v
catalog-service
```

No duplicar innecesariamente el catálogo en Redis.

Redis almacena el snapshot necesario para el carrito.

---

# FASE 17 — ACTUALIZAR CANTIDAD

Implementar:

```http
PUT /api/cart/:cartId/items/:productId
```

Body:

```json
{
  "quantity": 5
}
```

Validar cantidad.

Actualizar:

```text
quantity
subtotal
cart subtotal
updatedAt
TTL
```

---

# FASE 18 — ELIMINAR PRODUCTO

Implementar:

```http
DELETE /api/cart/:cartId/items/:productId
```

Debe eliminar únicamente esa línea.

Recalcular:

```text
subtotal
cantidad total de elementos
```

---

# FASE 19 — VACIAR CARRITO

Implementar:

```http
DELETE /api/cart/:cartId
```

Debe eliminar completamente la clave Redis.

---

# FASE 20 — FRONTEND ANGULAR

Modificar el Angular existente.

Actualmente existen:

```text
features/invoices
features/products
features/suppliers
core/services
core/models
```

Mantener esta organización.

Crear, según corresponda:

```text
core/models/cart.model.ts
core/services/cart.service.ts
```

No colocar llamadas HTTP directamente dentro de componentes si existe una capa de servicios.

---

# FASE 21 — CART SERVICE ANGULAR

Implementar métodos equivalentes a:

```typescript
getCart()
addItem()
updateItem()
removeItem()
clearCart()
```

Centralizar en ese servicio:

- URL;
- cartId;
- llamadas HttpClient;
- tipos.

Evitar duplicar lógica HTTP en componentes.

---

# FASE 22 — INTERFAZ DEL CARRITO

Agregar una interfaz de carrito clara y usable.

Debe mostrar como mínimo:

```text
Producto
Precio unitario
Cantidad
Subtotal
Acciones
```

Acciones:

```text
+
-
Eliminar
```

Además mostrar:

```text
Subtotal
Impuesto
Total estimado
```

---

# FASE 23 — INTEGRACIÓN CON PRODUCTOS

Modificar las vistas de productos que correspondan para permitir:

```text
Agregar al carrito
```

Preferentemente:

```text
[ Agregar al carrito ]
```

Al agregar:

- mostrar confirmación;
- actualizar contador;
- evitar recargar página completa;
- manejar error del servicio.

---

# FASE 24 — INDICADOR DEL CARRITO

Agregar un indicador visual en una ubicación lógica de navegación.

Por ejemplo:

```text
🛒 Carrito (3)
```

El número debe representar preferentemente:

```text
SUM(quantity)
```

y no únicamente la cantidad de productos distintos.

---

# FASE 25 — CREACIÓN DE FACTURA

Modificar:

```text
frontend/src/app/features/invoices/pages/invoice-form/
```

Actualmente el formulario solicita manualmente:

```text
Subtotal
Tax
Total
```

Reestructurarlo.

El formulario debe mostrar:

## Encabezado

- Supplier;
- Invoice number;
- Issue date;
- Due date;
- Status;
- Notes.

## Productos

Mostrar los productos provenientes del carrito.

Ejemplo:

```text
--------------------------------------------------------
Producto       Precio      Cantidad      Subtotal
--------------------------------------------------------
Laptop         Q5,000          1          Q5,000
Mouse          Q100            2          Q200
--------------------------------------------------------
Subtotal                                  Q5,200
Impuesto                                    Q...
TOTAL                                     Q...
--------------------------------------------------------
```

No pedir que el usuario escriba manualmente el subtotal.

---

# FASE 26 — PERMITIR VARIOS PRODUCTOS

Debe ser posible tener:

```text
Factura 001
 ├── Producto A x2
 ├── Producto B x1
 ├── Producto C x5
 └── Producto D x1
```

Sin límites artificiales de una sola línea.

---

# FASE 27 — CONFIRMAR FACTURA

Cuando el usuario presione:

```text
Crear factura
```

el flujo debe ser conceptualmente:

```text
Angular
   |
   v
Obtener carrito
   |
   v
Validar que tenga elementos
   |
   v
Enviar factura + items al backend .NET
   |
   v
Backend valida productos/montos
   |
   v
Crear Invoice
   |
   v
Crear InvoiceDetails
   |
   v
Commit DB
   |
   v
Respuesta OK
   |
   v
Eliminar carrito Redis
   |
   v
Ir a listado/detalle factura
```

---

# FASE 28 — CONSISTENCIA AL CREAR FACTURA

MUY IMPORTANTE:

No borrar el carrito antes de confirmar que la factura fue guardada correctamente.

Flujo incorrecto:

```text
borrar carrito
↓
guardar factura
↓
error
```

Flujo correcto:

```text
guardar factura
↓
respuesta exitosa
↓
eliminar carrito
```

Si falla el backend de facturación:

- mostrar error;
- conservar carrito.

---

# FASE 29 — TRANSACCIÓN EN BACKEND

Cuando se cree una factura y sus detalles, usar una operación transaccional cuando corresponda.

Debe evitarse:

```text
Invoice guardada
pero
InvoiceDetails incompletos
```

La creación debe considerarse una unidad lógica.

---

# FASE 30 — LECTURA DE FACTURA

Modificar el GET correspondiente para incluir sus detalles.

Una factura deberá poder devolver:

```json
{
  "id": "...",
  "number": "FAC-001",
  "supplierId": "...",
  "subtotal": 100,
  "tax": 12,
  "total": 112,
  "details": [
    {
      "productId": "...",
      "productName": "Producto A",
      "quantity": 2,
      "unitPrice": 50,
      "subtotal": 100
    }
  ]
}
```

---

# FASE 31 — EDICIÓN DE FACTURAS

Analiza el comportamiento existente de edición.

Si las facturas actualmente pueden editarse, adaptar el comportamiento para los nuevos detalles.

Evitar editar productos históricos de manera inconsistente.

Como mínimo debe ser posible visualizar correctamente facturas nuevas y existentes.

No eliminar características existentes sin necesidad.

---

# FASE 32 — LISTADO DE FACTURAS

Conservar el listado existente.

Si es útil, agregar:

```text
Cantidad de productos
```

o una acción:

```text
Ver detalle
```

No saturar la tabla.

---

# FASE 33 — UX/UI OBLIGATORIO

Todas las modificaciones frontend deben cumplir criterios básicos de UX/UI.

Esto es obligatorio.

Mantener consistencia visual con el proyecto existente.

Aplicar:

- jerarquía visual clara;
- espaciado uniforme;
- estados hover/focus;
- formularios legibles;
- botones con acciones claras;
- feedback después de agregar/eliminar producto;
- estados de carga;
- mensajes de error comprensibles;
- confirmación antes de acciones destructivas importantes;
- interfaz responsive;
- tablas adaptables;
- evitar información duplicada;
- evitar botones innecesarios;
- accesibilidad básica;
- labels asociadas a controles;
- contraste legible;
- navegación por teclado razonable.

No introducir una librería UI completa salvo que el proyecto ya la utilice.

---

# FASE 34 — DOCKER DEL CART-SERVICE

Crear:

```text
cart-service/Dockerfile
```

Utilizar imagen Node adecuada y razonablemente liviana.

Ejemplo conceptual:

```dockerfile
FROM node:22-alpine
```

Instalar únicamente dependencias necesarias.

No copiar:

```text
node_modules
```

desde la máquina host.

---

# FASE 35 — DOCKER COMPOSE

Modificar:

```text
practice3/eramirez-umg/docker-compose.yml
```

Agregar:

```text
redis
cart-service
```

Conectarlos a:

```text
enterprise_network
```

Configurar algo conceptualmente similar a:

```text
frontend
     |
     +------ backend
     |
     +------ catalog-service
     |
     +------ cart-service
                    |
                    v
                  redis
```

---

# FASE 36 — VARIABLES DE ENTORNO

El `cart-service` debe soportar variables similares a:

```env
PORT=3000
REDIS_HOST=redis
REDIS_PORT=6379
CART_TTL_SECONDS=86400
CATALOG_SERVICE_URL=http://catalog-service:8080
FRONTEND_ORIGIN=http://localhost:81
```

Crear:

```text
.env.example
```

No incluir secretos reales.

---

# FASE 37 — NGINX

Analiza:

```text
frontend/nginx.conf
```

Si Angular utiliza rutas proxy como `/api`, adapta Nginx para soportar el nuevo servicio.

Ejemplo conceptual:

```text
/api/cart/
   ->
cart-service
```

No romper rutas existentes hacia:

- backend;
- catalog-service.

Evitar CORS innecesario si se puede resolver mediante reverse proxy.

---

# FASE 38 — CONFIGURACIÓN ANGULAR

Actualizar:

```text
environment.ts
environment.*.ts
```

si existen y es necesario.

No hardcodear URLs distintas repetidamente en servicios.

Centralizar configuración.

---

# FASE 39 — AUTENTICACIÓN

Analiza cómo funciona actualmente el JWT.

Si las APIs existentes utilizan JWT:

- mantener el interceptor;
- propagar autorización cuando corresponda;
- proteger el carrito de modo coherente.

Si el `cart-service` necesita saber el usuario autenticado, reutilizar el claim disponible.

No implementar un segundo sistema de login.

---

# FASE 40 — SEGURIDAD DEL CARRITO

Evitar que un usuario pueda manipular directamente el carrito de otro usuario cuando exista autenticación.

Si la identidad proviene del JWT, preferir:

```text
cart:{authenticatedUserId}
```

en vez de aceptar libremente cualquier UserId enviado por Angular.

---

# FASE 41 — MANEJO DE ERRORES

Implementar respuestas HTTP coherentes:

```text
200
201
204
400
404
409
500
503
```

según corresponda.

Ejemplo:

```json
{
  "message": "Product not found"
}
```

No devolver stack traces al navegador.

---

# FASE 42 — HEALTHCHECKS

Agregar healthcheck al `cart-service`.

Por ejemplo:

```text
GET /health
```

Respuesta:

```json
{
  "status": "UP"
}
```

Idealmente validar también conectividad Redis.

Agregar healthcheck Redis en Docker Compose.

---

# FASE 43 — PRODUCTOS NO DISPONIBLES

Cuando se agrega al carrito, comprobar que el producto existe.

Al momento de crear la factura, volver a validar los productos importantes para evitar depender exclusivamente de información vieja almacenada en Redis.

Si un producto ya no existe o está inactivo:

- impedir la facturación;
- indicar qué producto provoca el problema.

---

# FASE 44 — PRECIOS

Definir explícitamente una estrategia consistente.

Preferencia:

Al agregar al carrito se almacena:

```text
productId
name
unitPrice
```

Pero antes de generar la factura se debe validar con el catálogo el precio actual o aplicar la regla de negocio existente.

Nunca aceptar como precio definitivo un valor arbitrario enviado por Angular.

---

# FASE 45 — STOCK

Si el modelo Product actual contiene stock/inventory:

- validar disponibilidad antes de facturar;
- evitar cantidad <= 0;
- evitar vender cantidad mayor al stock si esa es la regla actual del sistema.

Si el proyecto actualmente no administra stock, NO inventar un sistema completo de inventario.

---

# FASE 46 — README

Actualizar:

```text
practice3/eramirez-umg/README.md
```

Documentar:

## Arquitectura nueva

```text
Angular
   |
   +---- .NET Backend ---- MySQL
   |
   +---- Catalog Service ---- MongoDB
   |
   +---- Cart Service ---- Redis
```

Explicar:

- propósito de Redis;
- TTL;
- endpoints del carrito;
- nuevo flujo de facturación;
- cómo levantar servicios;
- puertos;
- variables de entorno;
- cómo probar manualmente.

---

# FASE 47 — DOCUMENTACIÓN TÉCNICA

Crear además:

```text
CART-INVOICE-IMPLEMENTATION.md
```

Debe documentar:

- problema anterior;
- arquitectura implementada;
- archivos creados;
- archivos modificados;
- endpoints;
- modelo Redis;
- estructura Invoice/InvoiceDetail;
- flujo carrito → factura;
- configuración Docker;
- decisiones técnicas;
- instrucciones de ejecución.

---

# FASE 48 — DOCUMENTAR UX/UI

Dentro del `.md` anterior agregar una sección:

```markdown
## UX/UI
```

Explicar las decisiones tomadas en frontend:

- estructura del carrito;
- visualización de cantidades;
- feedback;
- loading states;
- manejo de errores;
- responsive design;
- accesibilidad;
- confirmaciones.

Esto es obligatorio para cualquier modificación frontend.

---

# FASE 49 — VALIDACIÓN DE BUILD

Aunque NO debes crear unit tests, sí debes comprobar que la aplicación compile.

Ejecutar cuando sea posible:

```bash
docker compose config
```

Backend:

```bash
dotnet restore
dotnet build
```

Catalog service, si fue modificado:

```bash
./mvnw test -DskipTests
```

o el comando equivalente sin ejecutar pruebas.

Cart service:

```bash
npm install
npm run build
```

si usa TypeScript.

Frontend:

```bash
npm install
npm run build
```

Finalmente:

```bash
docker compose up -d --build
```

y revisar:

```bash
docker compose ps
```

---

# FASE 50 — VALIDACIÓN MANUAL

Sin crear pruebas unitarias, validar manualmente como mínimo:

### Caso 1

Agregar:

```text
Producto A x1
```

Resultado:

```text
carrito con 1 producto
```

### Caso 2

Agregar:

```text
Producto B x3
```

Resultado:

```text
carrito con dos productos diferentes
```

### Caso 3

Agregar nuevamente Producto A.

Debe aumentar cantidad o consolidarse.

### Caso 4

Modificar cantidad.

### Caso 5

Eliminar producto.

### Caso 6

Crear factura con 2+ productos.

Verificar que:

```text
Invoice
```

y:

```text
InvoiceDetails
```

se guarden correctamente.

### Caso 7

Confirmar que después de generar correctamente la factura:

```text
Redis ya no contiene ese carrito
```

### Caso 8

Provocar error de facturación.

Confirmar que:

```text
el carrito permanece en Redis
```

---

# FASE 51 — NO ROMPER FUNCIONALIDAD EXISTENTE

Deben seguir funcionando:

- autenticación;
- Suppliers;
- Products;
- Categories;
- listado de Invoices;
- edición/consulta que corresponda;
- catalog-service;
- backend .NET;
- frontend Angular;
- MySQL;
- MongoDB;
- Docker Compose.

No eliminar servicios existentes.

---

# FASE 52 — COMPATIBILIDAD CON FACTURAS HISTÓRICAS

Si existen facturas anteriores sin detalles:

la API y el frontend no deben fallar.

Aceptar:

```text
details = []
```

para registros históricos cuando corresponda.

---

# FASE 53 — LIMPIEZA

No dejar:

- código comentado innecesariamente;
- TODO temporales;
- imports sin utilizar;
- variables muertas;
- servicios duplicados;
- endpoints antiguos sin uso;
- URLs hardcodeadas repetidas;
- archivos temporales;
- `node_modules`;
- secretos;
- contraseñas nuevas hardcodeadas.

---

# RESULTADO ESPERADO

Al finalizar debe ser posible ejecutar:

```bash
cd practice3/eramirez-umg
docker compose up -d --build
```

y disponer de una arquitectura funcional:

```text
                    ┌──────────────┐
                    │   Angular    │
                    └──────┬───────┘
                           │
             ┌─────────────┼──────────────┐
             │             │              │
             ▼             ▼              ▼
      ┌───────────┐ ┌─────────────┐ ┌──────────────┐
      │ .NET API  │ │Catalog       │ │ Cart Service │
      │ Invoices  │ │Service       │ │   Node.js    │
      └─────┬─────┘ └──────┬──────┘ └──────┬───────┘
            │              │                │
            ▼              ▼                ▼
         MySQL          MongoDB           Redis
```

Y el flujo funcional:

```text
Productos
   ↓
Agregar al carrito
   ↓
Node.js Cart Service
   ↓
Redis TTL 24h
   ↓
Agregar/modificar/eliminar varios productos
   ↓
Formulario de factura
   ↓
Seleccionar proveedor
   ↓
Visualizar productos
   ↓
Calcular subtotal/impuesto/total
   ↓
Crear factura
   ↓
.NET Backend
   ↓
Invoice + InvoiceDetails
   ↓
MySQL
   ↓
Respuesta exitosa
   ↓
Eliminar carrito de Redis
```

---

# FORMATO DE RESPUESTA FINAL DE CODEX

Cuando termines, proporciona un resumen estructurado:

```markdown
# Implementación completada

## Archivos creados

- ...

## Archivos modificados

- ...

## Backend .NET

- ...

## InvoiceDetail

- ...

## Cart Service Node.js

- ...

## Redis

- ...

## Frontend Angular

- ...

## UX/UI

- ...

## Docker

- ...

## Endpoints creados

| Método | Endpoint | Descripción |
|---|---|---|
| GET | ... | ... |

## Modelo Redis

...

## Flujo de facturación

...

## Migraciones

...

## Validaciones implementadas

...

## Comandos para ejecutar

...

## Validaciones manuales realizadas

...

## Pendientes

...
```

No generes solamente recomendaciones.

Debes **modificar realmente todos los archivos necesarios** para dejar la funcionalidad implementada y compilable.

No crear pruebas unitarias.