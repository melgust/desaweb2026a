# Suppliers e Invoices

Implementación limitada a `practice3/crobless`, rama `crobless`. Se mantiene .NET 10, EF Core 9, MySQL 8, Angular 18 standalone, JWT y los roles existentes.

## Suppliers

Ya existían entidad, DTOs, servicio, controlador, listado paginado, formulario y rutas. Se reutilizaron.

- Validación de nombre obligatorio (150 caracteres), correo opcional válido (150), teléfono (50) y paginación.
- Formulario con validación de Angular, bloqueo de envío inválido o repetido y mensajes de error de API.
- Respuestas 404 para inexistentes y errores comprensibles al eliminar proveedores utilizados por facturas.
- Se conserva la relación existente con Products: eliminar un proveedor sin facturas deja sus productos sin proveedor (`SET NULL`).
- Se conserva FormsModule en Suppliers, siguiendo el formulario existente. Invoices usa Reactive Forms y FormArray para el detalle dinámico.

## Invoices

- `Invoice` y `InvoiceDetail`, identificadores GUID y fecha `DateOnly`.
- DTOs de creación, actualización y respuesta; no se serializan entidades EF.
- `InvoiceService`, `IInvoiceService` e `InvoicesController` registrados en DI.
- Tablas, claves, índice único de número, relaciones y precisión `decimal(18,2)` explícitas en `AppDbContext`.
- Proveedor obligatorio y entre 1 y 500 detalles. Productos existentes, cantidades enteras positivas, precios no negativos con hasta dos decimales y fecha dentro del rango MySQL.
- Número obligatorio de hasta 50 caracteres, notas hasta 2000 y validación del límite monetario antes de persistir.
- Subtotales y totales calculados exclusivamente en backend. Campos adicionales enviados como `total` no determinan los importes guardados.
- Cada detalle conserva su precio unitario. Cambiar el precio del producto no altera la factura.
- Creación y edición se guardan con un único `SaveChangesAsync`, transaccional en MySQL. La edición reemplaza los detalles y los registra explícitamente como nuevos en EF.
- Eliminar una factura elimina sus detalles. Las FK impiden eliminar proveedores o productos utilizados por facturas.
- Consultas con `Include`/`ThenInclude` y respuestas sin ciclos, sin consultas individuales por producto.
- Angular consume la API real mediante `environment`: listado, vista de lectura, creación y edición, selectores y detalle dinámico con previsualización de totales.
- Rutas protegidas `/invoices`, `/invoices/new`, `/invoices/edit/:id`, `/invoices/view/:id`; menú Products, Categories, Suppliers e Invoices.
- Se corrigió el registro DI faltante de Categories para que su API y los formularios de productos funcionen.

### Regla de impuesto

El proyecto no definía impuestos. La regla del ejercicio es **0 %**, centralizada en `InvoiceService.TaxRate`. No se asume una regla fiscal de IVA. Angular obtiene esta tasa desde `GET /api/invoices/settings`; no hay una segunda constante de tasa en el frontend. Las vistas de lectura muestran los importes guardados. Si se modifica la tasa, las facturas que se editen volverán a calcularse con la nueva regla.

## Endpoints

Todos los IDs son GUID. Lectura: Admin, Manager, User; creación/edición: Admin, Manager; eliminación: Admin. Login es público.

| Método | Ruta | Resultado |
|---|---|---|
| POST | `/api/auth/login` | JWT y usuario |
| GET | `/api/suppliers` | Listado paginado; search, sortBy, sortDirection, page, pageSize |
| GET | `/api/suppliers/all` | Proveedores activos para selectores |
| GET | `/api/suppliers/{id}` | Proveedor |
| POST | `/api/suppliers` | Crear, 201 |
| PUT | `/api/suppliers/{id}` | Editar, 200 |
| DELETE | `/api/suppliers/{id}` | Eliminar, 204 |
| GET | `/api/invoices` | Facturas con detalles |
| GET | `/api/invoices/settings` | Tasa centralizada |
| GET | `/api/invoices/{id}` | Factura con proveedor y productos |
| POST | `/api/invoices` | Crear, 201 y Location |
| PUT | `/api/invoices/{id}` | Editar, 200 |
| DELETE | `/api/invoices/{id}` | Eliminar, 204 |
| GET | `/api/products` | Listado paginado con búsqueda y ordenamiento |
| GET | `/api/products/all` | Productos para selector de facturas, incluidos inactivos |
| GET | `/api/products/{id}` | Producto |
| POST | `/api/products` | Crear, 201 |
| PUT | `/api/products/{id}` | Editar, 200 |
| DELETE | `/api/products/{id}` | Eliminar, 204; bloqueado si tiene facturas |
| GET | `/api/categories` | Listado paginado; search, page, pageSize |
| GET | `/api/categories/all` | Categorías activas |
| GET | `/api/categories/{id}` | Categoría |
| POST | `/api/categories` | Crear, 201 |
| PUT | `/api/categories/{id}` | Editar, 200 |
| DELETE | `/api/categories/{id}` | Eliminar, 204 |

Inexistentes: 404. Validaciones de factura/proveedor y relaciones: 400. Sin autenticación: 401. Rol insuficiente: 403. Los errores de negocio usan `{ "message": "..." }`; la validación automática de ASP.NET usa ValidationProblemDetails y Angular maneja ambos formatos.

## Base de datos

Migración generada: `20260912003043_AddInvoices`. Crea solamente `Invoices`, `InvoiceDetails` y sus índices/FK. Se conservaron las tres migraciones anteriores y se actualizó el snapshot existente. Se verificó que no quedan cambios de modelo pendientes.

El arranque actual del backend aplica `Database.Migrate()` automáticamente. Para aplicarla manualmente desde `backend`, con la conexión correspondiente configurada:

```powershell
dotnet tool install dotnet-ef --version 9.0.0 --tool-path .tools
$env:ConnectionStrings__DefaultConnection = 'Server=localhost;Port=3307;Database=EnterpriseDb;User Id=root;Password=YourSecurePassword123!;'
.\.tools\dotnet-ef database update --project src/Api
```

La instalación de la herramienta solo se necesita una vez. No se borraron migraciones ni se reseteó ninguna base de datos. La prueba Docker utilizó el volumen propio `crobless_db_data`; no se modificó el contenedor de otro ejercicio que ocupaba el nombre global `enterprise_db`.

## Ejecución

Desde `practice3/crobless`:

```powershell
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

Frontend: <http://localhost:81>. API: <http://localhost:5000/api>. MySQL: `localhost:3307`. Los tres contenedores quedaron en ejecución. Compose genera nombres por proyecto y espera a que MySQL esté saludable. Se mantiene el volumen `db_data` y los servicios originales.

Desarrollo local, en terminales separadas:

```powershell
# Backend; MySQL debe estar disponible
cd backend
$env:ConnectionStrings__DefaultConnection = 'Server=localhost;Port=3307;Database=EnterpriseDb;User Id=root;Password=YourSecurePassword123!;'
dotnet restore
dotnet build
dotnet run --project src/Api --urls http://localhost:5000
```

```powershell
cd frontend
npm.cmd install --ignore-scripts
npm.cmd start
```

`npm.cmd` evita la restricción de ejecución de scripts PowerShell del entorno. `--ignore-scripts` sigue la convención del Dockerfile para las dependencias de AdminLTE. Para desarrollo local usa puertos libres y detén antes el servicio Docker que ocupe el mismo puerto.

## Verificación

Ejecutada el 11 de septiembre de 2026, hora local:

| Comprobación | Resultado |
|---|---|
| `dotnet restore` | Correcto |
| `dotnet build` | Correcto, 0 errores y 0 advertencias |
| EF `migrations has-pending-model-changes` | Sin cambios pendientes |
| `npm.cmd install --ignore-scripts` | Correcto |
| `npm.cmd run build` | Correcto, producción |
| `docker compose config --quiet` | Correcto |
| `docker compose up --build -d` | Correcto; MySQL, backend y frontend en ejecución |
| Migración en MySQL | Las cuatro migraciones constan en `__EFMigrationsHistory` |
| `python backend/tests/api_smoke.py` | 61 comprobaciones HTTP correctas |
| `node backend/tests/browser_smoke.cjs` | Flujo completo correcto en Chrome headless |
| Limpieza de datos de pruebas | Cero facturas y cero detalles restantes; productos/proveedores temporales eliminados |

Las pruebas HTTP cubren CRUD, proveedor inexistente, formato de correo, roles, número duplicado, detalles inválidos, conservación de una factura tras actualización rechazada, importes no confiables enviados por el cliente, precios históricos, eliminación restringida y preservación del comportamiento SET NULL de Products.

Chrome ejecutó login, creación y edición de proveedor, creación de producto, selección de proveedor/producto, previsualización de totales, creación, consulta, recarga directa de ruta, edición con eliminación de una línea y eliminación de factura. No se detectaron errores JavaScript de página. Fue una prueba automatizada en navegador real, no una revisión manual visual.

Para repetir el navegador (requiere Chrome instalado):

```powershell
npm.cmd install --prefix backend/.tools/browser playwright --ignore-scripts --no-audit --no-fund
node backend/tests/browser_smoke.cjs
```

Ambos scripts usan las cuentas de desarrollo del seeder y eliminan únicamente sus propios registros. Admiten `API_URL`, `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`; el navegador admite también `FRONTEND_URL`.

La instalación inicial encontró problemas de certificados del entorno. Se resolvieron usando los certificados de confianza de Windows para Node y ejecutando NuGet con acceso permitido; no se deshabilitó TLS ni se incorporaron ajustes de certificados al repositorio. Angular conserva dos advertencias de selectores de las hojas de estilo existentes. npm reporta advertencias y vulnerabilidades de dependencias existentes de AdminLTE; no se cambiaron sus versiones ni se aplicaron actualizaciones incompatibles.

## Archivos creados

```text
IMPLEMENTATION.md
backend/.dockerignore
backend/src/Api/Controllers/InvoicesController.cs
backend/src/Application/DTOs/InvoiceDtos.cs
backend/src/Application/Services/InvoiceService.cs
backend/src/Domain/Entities/Invoice.cs
backend/src/Domain/Entities/InvoiceDetail.cs
backend/src/Infrastructure/Data/Migrations/20260912003043_AddInvoices.Designer.cs
backend/src/Infrastructure/Data/Migrations/20260912003043_AddInvoices.cs
backend/tests/api_smoke.py
backend/tests/browser_smoke.cjs
frontend/.dockerignore
frontend/nginx.conf
frontend/src/app/core/models/invoice.model.ts
frontend/src/app/core/services/api-error.ts
frontend/src/app/core/services/invoice.service.ts
frontend/src/app/features/invoices/pages/invoice-form/invoice-form.component.css
frontend/src/app/features/invoices/pages/invoice-form/invoice-form.component.html
frontend/src/app/features/invoices/pages/invoice-form/invoice-form.component.ts
frontend/src/app/features/invoices/pages/invoice-list/invoice-list.component.html
frontend/src/app/features/invoices/pages/invoice-list/invoice-list.component.ts
```

## Archivos modificados

```text
.gitignore
CONTAINERS.md
README.md
backend/src/Api/Controllers/ProductsController.cs
backend/src/Api/Migrations/AppDbContextModelSnapshot.cs
backend/src/Api/Program.cs
backend/src/Application/DTOs/SupplierDtos.cs
backend/src/Application/Services/ProductService.cs
backend/src/Application/Services/SupplierService.cs
backend/src/Infrastructure/Data/AppDbContext.cs
docker-compose.yml
frontend/Dockerfile
frontend/src/app/app.component.ts
frontend/src/app/app.routes.ts
frontend/src/app/core/services/product.service.ts
frontend/src/app/features/suppliers/pages/supplier-form/supplier-form.component.html
frontend/src/app/features/suppliers/pages/supplier-form/supplier-form.component.ts
frontend/src/app/features/suppliers/pages/supplier-list/supplier-list.component.html
frontend/src/app/features/suppliers/pages/supplier-list/supplier-list.component.ts
```
