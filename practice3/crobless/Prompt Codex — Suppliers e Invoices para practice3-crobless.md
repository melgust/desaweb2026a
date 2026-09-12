# Implementación de Suppliers e Invoices — `practice3/crobless`

Trabaja exclusivamente sobre:

```text
practice3/crobless
```

del repositorio:

```text
https://github.com/melgust/desaweb2026a
```

Rama:

```text
crobless
```

## Objetivo

Necesito completar e integrar correctamente la funcionalidad de:

1. **Suppliers / Proveedores**
2. **Invoices / Facturas**

tanto en el backend como en el frontend.

Antes de modificar código, analiza completamente la arquitectura existente dentro de:

```text
practice3/crobless/backend
practice3/crobless/frontend
```

No cambies innecesariamente la arquitectura actual.

---

# 1. Estado actual que debes respetar

El backend actualmente utiliza una arquitectura separada en:

```text
backend/src/
├── Api
├── Application
├── Domain
└── Infrastructure
```

El frontend utiliza Angular con componentes standalone y una estructura similar a:

```text
frontend/src/app/
├── core
│   ├── guards
│   ├── interceptors
│   ├── models
│   └── services
│
└── features
    ├── auth
    ├── categories
    ├── products
    └── suppliers
```

Utiliza las implementaciones existentes de:

```text
Categories
Products
Suppliers
```

como referencia para mantener:

- estructura;
- convenciones;
- nombres;
- manejo de errores;
- autenticación;
- autorización;
- DTOs;
- servicios;
- controladores;
- rutas;
- formularios;
- componentes Angular;
- estilos.

No introduzcas otra arquitectura ni otro framework.

---

# 2. Suppliers — auditar y completar

Actualmente Suppliers ya tiene implementación parcial/tendiente a completa.

Existen elementos como:

```text
Domain/Entities/Supplier.cs
Application/Services/SupplierService.cs
Api/Controllers/SuppliersController.cs
frontend/src/app/core/services/supplier.service.ts
frontend/src/app/features/suppliers
```

Por lo tanto:

**NO vuelvas a crear Suppliers desde cero.**

Primero inspecciona su implementación actual y determina qué falta.

Debes verificar que Suppliers tenga un CRUD completo y funcional.

## Backend Suppliers

Debe existir correctamente:

```http
GET    /api/suppliers
GET    /api/suppliers/{id}
POST   /api/suppliers
PUT    /api/suppliers/{id}
DELETE /api/suppliers/{id}
```

Respeta exactamente la convención de rutas utilizada actualmente por los controladores del proyecto.

Verifica:

- entidad `Supplier`;
- DTOs;
- `SupplierService`;
- `SuppliersController`;
- inyección de dependencias;
- Entity Framework Core;
- `DbSet<Supplier>`;
- configuración de relaciones;
- validaciones;
- códigos HTTP;
- manejo de proveedor inexistente;
- referencias desde Products.

No dupliques clases o servicios que ya existen.

Si alguno está incompleto, corrígelo.

---

# 3. Frontend Suppliers

Audita:

```text
frontend/src/app/features/suppliers
frontend/src/app/core/services/supplier.service.ts
frontend/src/app/core/models
frontend/src/app/app.routes.ts
frontend/src/app/app.component.ts
```

Verifica que exista una interfaz completamente funcional para:

### Listar proveedores

Ruta:

```text
/suppliers
```

Debe mostrar al menos:

- nombre;
- correo de contacto;
- teléfono;
- acciones.

Acciones:

```text
Editar
Eliminar
```

Debe existir botón:

```text
Nuevo proveedor
```

---

## Crear proveedor

Ruta:

```text
/suppliers/new
```

Formulario basado en los campos reales de `Supplier`.

Debe utilizar Reactive Forms si el proyecto ya usa ese patrón.

Validar los campos según las reglas establecidas en backend.

---

## Editar proveedor

Ruta:

```text
/suppliers/edit/:id
```

Debe:

1. consultar el proveedor;
2. cargar sus valores;
3. permitir modificarlos;
4. realizar `PUT`;
5. regresar al listado después de guardar.

---

## Eliminar proveedor

Desde el listado:

```text
DELETE /api/suppliers/{id}
```

Solicitar confirmación antes de eliminar.

Manejar correctamente errores si el proveedor está relacionado con otra información y no puede eliminarse.

---

# 4. Implementar Invoices

Invoices actualmente no existe de forma completa en el proyecto.

Implementa este módulo siguiendo exactamente el patrón arquitectónico existente.

Debe existir una factura con encabezado y detalle.

Modelo lógico:

```text
Invoice
    Id
    InvoiceNumber
    InvoiceDate
    SupplierId
    Supplier
    Subtotal
    Tax
    Total
    Notes
    CreatedAt

InvoiceDetail
    Id
    InvoiceId
    Invoice
    ProductId
    Product
    Quantity
    UnitPrice
    Subtotal
```

Antes de utilizar exactamente estos campos, inspecciona las entidades existentes y adapta tipos, nombres y convenciones al proyecto.

No utilices `double` para valores monetarios.

Utiliza:

```csharp
decimal
```

y configura precisión adecuada con Entity Framework Core, por ejemplo:

```text
18,2
```

---

# 5. Relaciones de Invoices

Implementa las relaciones:

```text
Supplier 1 ---- N Invoice
Invoice  1 ---- N InvoiceDetail
Product  1 ---- N InvoiceDetail
```

Una factura debe pertenecer a un proveedor.

Una factura debe contener uno o más productos.

Cada detalle debe almacenar:

```text
ProductId
Quantity
UnitPrice
Subtotal
```

El precio utilizado en la factura debe conservarse en `InvoiceDetail.UnitPrice`.

No depender posteriormente del precio actual del producto para reconstruir facturas históricas.

---

# 6. Domain

Agregar las entidades necesarias dentro de:

```text
backend/src/Domain/Entities
```

Preferentemente:

```text
Invoice.cs
InvoiceDetail.cs
```

Respeta namespaces y estilo existentes.

Agregar propiedades de navegación únicamente donde tengan sentido.

Por ejemplo:

```text
Supplier
    ICollection<Invoice>

Product
    ICollection<InvoiceDetail>

Invoice
    Supplier
    ICollection<InvoiceDetail>
```

Evita ciclos innecesarios en serialización.

---

# 7. Infrastructure

Actualizar:

```text
Infrastructure/Data/AppDbContext.cs
```

Agregar:

```csharp
DbSet<Invoice>
DbSet<InvoiceDetail>
```

Configurar explícitamente:

- tablas;
- PK;
- FK;
- precisión decimal;
- restricciones;
- relaciones;
- comportamiento `OnDelete`.

No utilizar `Cascade` indiscriminadamente.

Para registros históricos de factura, evita configuraciones que permitan borrar accidentalmente Products o Suppliers utilizados por facturas.

---

# 8. Migración de Entity Framework

Crear una migración para Invoices.

Ejemplo conceptual:

```text
AddInvoices
```

Debe crear las tablas y relaciones correspondientes.

No borres las migraciones existentes.

No resetees la base de datos.

No alteres datos actuales innecesariamente.

---

# 9. DTOs para Invoice

Crear DTOs dentro de:

```text
Application/DTOs
```

siguiendo el patrón actual.

Separar correctamente requests y responses.

Por ejemplo:

```text
CreateInvoiceDto
UpdateInvoiceDto
InvoiceDto
InvoiceDetailDto
CreateInvoiceDetailDto
```

No exponer directamente entidades EF en la API si la arquitectura existente usa DTOs.

Un request de creación puede conceptualmente ser:

```json
{
  "supplierId": 1,
  "invoiceDate": "2026-09-11",
  "notes": "Compra de inventario",
  "items": [
    {
      "productId": 1,
      "quantity": 3,
      "unitPrice": 25.50
    },
    {
      "productId": 5,
      "quantity": 2,
      "unitPrice": 10.00
    }
  ]
}
```

Adapta nombres al estilo actual.

---

# 10. Cálculos de factura

Los totales deben calcularse en backend.

No confiar en valores enviados por Angular para:

```text
Subtotal
Tax
Total
```

Calcular:

```text
detailSubtotal = quantity * unitPrice
```

Luego:

```text
invoiceSubtotal = suma(detailSubtotal)
```

Si el proyecto maneja impuesto:

```text
tax = invoiceSubtotal * porcentaje
total = invoiceSubtotal + tax
```

Si actualmente no existe una regla para IVA/impuesto, crea una solución simple y centralizada, evitando números mágicos distribuidos por el código.

Para Guatemala, si se decide utilizar IVA estándar como regla del ejercicio, documentar claramente el porcentaje utilizado y centralizarlo en una constante/configuración.

---

# 11. Validaciones de Invoice

Como mínimo validar:

- `SupplierId` existente;
- factura con al menos un detalle;
- `ProductId` existente;
- `Quantity > 0`;
- `UnitPrice >= 0`;
- fecha válida;
- InvoiceNumber no duplicado si se utiliza como identificador único.

Nunca permitir guardar una factura parcialmente válida.

Si falla la creación del detalle, la factura completa debe revertirse.

La operación debe ser transaccional.

---

# 12. InvoiceService

Crear:

```text
Application/Services/InvoiceService.cs
```

Siguiendo el patrón de:

```text
ProductService
CategoryService
SupplierService
```

Implementar operaciones equivalentes a:

```text
GetAllAsync
GetByIdAsync
CreateAsync
UpdateAsync
DeleteAsync
```

Adapta los nombres a la convención real existente.

Al consultar facturas cargar la información necesaria de:

```text
Supplier
InvoiceDetails
Product
```

Evitar N+1 queries.

Utilizar `Include` / `ThenInclude` cuando corresponda.

---

# 13. InvoicesController

Crear:

```text
Api/Controllers/InvoicesController.cs
```

Endpoints mínimos:

```http
GET    /api/invoices
GET    /api/invoices/{id}
POST   /api/invoices
PUT    /api/invoices/{id}
DELETE /api/invoices/{id}
```

Opcionalmente agregar si es útil:

```http
GET /api/invoices/supplier/{supplierId}
```

Mantener:

- códigos HTTP correctos;
- `404` cuando no exista;
- `400` para requests inválidos;
- `201 Created` al crear;
- autenticación/autorización igual al resto de controladores.

---

# 14. Registrar InvoiceService

Actualizar la configuración de DI del backend.

Inspecciona:

```text
Program.cs
```

y registra `InvoiceService` exactamente como se registran:

```text
ProductService
SupplierService
CategoryService
```

No cambies el mecanismo de DI existente.

---

# 15. Frontend — modelo Invoice

Crear interfaces/modelos dentro de la ubicación utilizada actualmente por el proyecto.

Conceptualmente:

```typescript
export interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  supplierId: number;
  supplierName?: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  items: InvoiceDetail[];
}
```

y:

```typescript
export interface InvoiceDetail {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
```

Adapta nombres a las respuestas reales de la API.

---

# 16. InvoiceService Angular

Crear:

```text
frontend/src/app/core/services/invoice.service.ts
```

Siguiendo el patrón de:

```text
product.service.ts
supplier.service.ts
category.service.ts
```

Implementar:

```typescript
getAll()
getById(id)
create(request)
update(id, request)
delete(id)
```

No escribir URLs absolutas repetidas.

Utilizar:

```text
environment
```

y la configuración existente del proyecto.

---

# 17. Feature Angular Invoices

Crear:

```text
frontend/src/app/features/invoices
```

con una estructura equivalente a Products/Suppliers.

Como mínimo:

```text
features/invoices/
└── pages/
    ├── invoice-list/
    └── invoice-form/
```

Si mejora la organización, puede agregarse:

```text
invoice-detail/
```

pero mantenerlo simple.

---

# 18. Pantalla listado de facturas

Ruta:

```text
/invoices
```

Mostrar una tabla con:

```text
Número
Fecha
Proveedor
Subtotal
Impuesto
Total
Acciones
```

Acciones:

```text
Ver
Editar
Eliminar
```

Si no se crea una pantalla `invoice-detail`, permitir al menos editar desde el listado.

Agregar botón:

```text
Nueva factura
```

---

# 19. Crear factura en Angular

Ruta:

```text
/invoices/new
```

Formulario con:

### Encabezado

```text
Número de factura
Fecha
Proveedor
Notas
```

Proveedor debe seleccionarse mediante un `<select>` cargado desde:

```text
SupplierService
```

---

# 20. Detalle dinámico

La factura debe permitir agregar múltiples productos.

Cada fila debe tener:

```text
Producto
Cantidad
Precio unitario
Subtotal
Eliminar
```

Debe existir botón:

```text
Agregar producto
```

Producto debe cargarse desde:

```text
ProductService
```

Al seleccionar un producto, se puede precargar su precio actual como precio unitario.

El usuario puede modificarlo si el modelo de negocio lo permite.

El subtotal de la línea debe actualizarse automáticamente:

```text
cantidad × precioUnitario
```

Mostrar abajo:

```text
Subtotal
Impuesto
Total
```

Los cálculos del frontend son únicamente visuales.

El backend sigue siendo la fuente definitiva del cálculo.

---

# 21. Formularios dinámicos

Preferir:

```text
ReactiveFormsModule
FormBuilder
FormGroup
FormArray
Validators
```

si encajan con el patrón actual.

Para detalle de factura utilizar preferentemente:

```text
FormArray
```

Una fila del detalle debe poder agregarse y eliminarse dinámicamente.

No guardar una factura sin detalles.

---

# 22. Editar factura

Ruta:

```text
/invoices/edit/:id
```

Debe:

1. obtener factura;
2. cargar encabezado;
3. reconstruir `FormArray`;
4. permitir agregar/eliminar/modificar detalles;
5. ejecutar `PUT`;
6. regresar al listado.

---

# 23. Navegación

Actualizar:

```text
frontend/src/app/app.routes.ts
```

Agregar rutas protegidas:

```text
/invoices
/invoices/new
/invoices/edit/:id
```

utilizando:

```text
authGuard
```

igual que Products y Suppliers.

---

Actualizar también:

```text
frontend/src/app/app.component.ts
```

El menú autenticado actualmente incluye Products y Suppliers.

Agregar:

```text
Categories
Invoices
```

si Categories ya está implementado pero no aparece en navegación.

El menú final debe permitir navegar como mínimo a:

```text
Products
Categories
Suppliers
Invoices
```

Mantener el mismo diseño actual.

---

# 24. Autenticación

No reemplazar:

```text
authGuard
AuthService
JWT interceptor
```

ni la autenticación existente.

Invoices y Suppliers deben funcionar dentro de la seguridad actual.

No crear un segundo mecanismo de autenticación.

---

# 25. Docker

Revisar:

```text
practice3/crobless/docker-compose.yml
backend/Dockerfile
frontend/Dockerfile
```

No agregar servicios Docker innecesarios.

Invoices forma parte del backend actual, por lo que no debe crearse otro contenedor solo por ser otro módulo.

Después de los cambios verificar que continúe funcionando:

```bash
docker compose up --build
```

---

# 26. Compatibilidad

Los cambios NO deben romper:

```text
Login
Products
Categories
Suppliers
Docker
JWT
Base de datos existente
```

No realizar refactors masivos ajenos al objetivo.

---

# 27. Código existente

Antes de escribir cualquier archivo:

1. inspecciona el repositorio;
2. identifica DTOs actuales;
3. identifica convenciones de Services;
4. identifica formato de Controllers;
5. identifica cómo funciona `AppDbContext`;
6. identifica configuración de DI;
7. identifica los modelos Angular;
8. identifica los servicios Angular;
9. identifica cómo están hechos ProductForm y SupplierForm;
10. replica esos patrones.

No inventes una implementación completamente diferente si ya existe una convención clara.

---

# 28. Suppliers

Recuerda especialmente:

**Suppliers ya existe.**

No crear:

```text
Supplier2
NewSupplier
SupplierManagement
```

ni duplicar:

```text
SupplierService
SuppliersController
supplier.service.ts
```

Inspecciona los existentes, corrige lo necesario y reutilízalos.

---

# 29. Invoices

Invoices sí debe integrarse como módulo nuevo a través de las capas existentes:

```text
Domain
   ↓
Infrastructure
   ↓
Application
   ↓
Api
   ↓
Angular Service
   ↓
Angular Feature
```

Debe quedar funcional de extremo a extremo.

---

# 30. Verificación backend

Al finalizar ejecutar, cuando el entorno lo permita:

```bash
dotnet restore
dotnet build
```

y las pruebas existentes si las hubiera.

Verifica que no existan:

```text
errores de compilación
warnings críticos
referencias rotas
errores de namespace
servicios sin registrar
migraciones inconsistentes
```

---

# 31. Verificación Angular

Ejecutar:

```bash
npm install
npm run build
```

o los scripts equivalentes definidos en `package.json`.

Corregir:

```text
errores TypeScript
imports inexistentes
rutas rotas
templates inválidos
errores de Reactive Forms
tipos inconsistentes
```

---

# 32. Verificación funcional

Comprobar manualmente el flujo:

```text
Login
   ↓
Suppliers
   ↓
Crear proveedor
   ↓
Products
   ↓
Crear/seleccionar productos
   ↓
Invoices
   ↓
Nueva factura
   ↓
Seleccionar proveedor
   ↓
Agregar productos
   ↓
Guardar
   ↓
Consultar factura
   ↓
Editar
   ↓
Eliminar
```

---

# 33. No hacer

No:

- crear otro frontend;
- crear otra API;
- cambiar Angular por React/Vue;
- cambiar .NET;
- reemplazar Entity Framework;
- eliminar autenticación;
- reemplazar PostgreSQL/DB existente si el proyecto ya usa otro motor;
- borrar migraciones;
- eliminar Suppliers existente;
- duplicar servicios;
- modificar carpetas fuera de `practice3/crobless`;
- hacer refactors masivos no relacionados;
- utilizar datos mock cuando existe API real.

---

# 34. Entregable final

Implementa directamente los cambios.

Al finalizar entrega un resumen Markdown indicando:

## Archivos creados

```text
ruta/archivo
```

## Archivos modificados

```text
ruta/archivo
```

## Suppliers

Indicar:

```text
qué ya existía
qué se corrigió
qué se agregó
```

## Invoices

Indicar:

```text
entidad
detalle
DTOs
servicio
controller
DbContext
migración
Angular service
componentes
rutas
```

## Endpoints

Documentar todos los endpoints disponibles.

## Base de datos

Indicar la migración creada y cómo aplicarla.

## Ejecución

Dar los comandos necesarios para ejecutar el proyecto.

## Verificación

Indicar explícitamente si:

```text
dotnet build
npm run build
docker compose config
```

fueron ejecutados y su resultado.

No afirmes que una validación pasó si realmente no pudo ejecutarse.

---

# Criterio de finalización

La tarea solamente se considera terminada cuando:

```text
Suppliers continúa funcionando
+
Invoices tiene backend
+
Invoices tiene persistencia
+
Invoices tiene endpoints
+
Invoices tiene frontend
+
Invoices aparece en navegación
+
Angular consume la API real
+
el proyecto compila
```

Mantén todos los cambios estrictamente dentro de:

```text
practice3/crobless
```