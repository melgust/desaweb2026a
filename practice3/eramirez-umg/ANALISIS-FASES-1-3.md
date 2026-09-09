# Analisis de migracion: fases 1, 2 y 3

Este documento registra el analisis previo a la migracion de Categories, Products y Suppliers. La fuente de verdad utilizada fue el backend .NET y sus consumidores Angular actuales.

## 1. Backend actual

### Controladores y seguridad

Los cuatro controladores usan la ruta `api/[controller]`, por lo que sus rutas publicas actuales son `/api/categories`, `/api/products`, `/api/suppliers` y `/api/invoices`. Todos requieren JWT; las operaciones de lectura aceptan `Admin`, `Manager` y `User`, crear/actualizar aceptan `Admin` y `Manager`, y eliminar acepta solamente `Admin`.

El backend registra los servicios directamente en `Program.cs` y todos usan `AppDbContext` de Entity Framework Core. No existen repositories separados: la logica de acceso a datos esta dentro de los servicios de Application.

### Categories

Entidad `Category`:

- `Guid Id`, generado en la entidad.
- `string Name`, requerido por la logica de create/update y recortado con `Trim()`.
- `string? Description`.
- `DateTime CreatedAt`, UTC.
- Coleccion de productos solamente como navegacion EF.

Contrato:

| Metodo | Ruta | Request | Response |
|---|---|---|---|
| GET | `/api/categories` | ninguno | `CategoryDto[]`, ordenado por `Name` |
| GET | `/api/categories/{guid}` | ninguno | `CategoryDto` |
| POST | `/api/categories` | `{ name, description? }` | `201`, `CategoryDto` y `Location` |
| PUT | `/api/categories/{guid}` | `{ name, description? }` | `200`, `CategoryDto` |
| DELETE | `/api/categories/{guid}` | ninguno | `204` |

`CategoryDto` contiene `id`, `name`, `description` y `createdAt`. Un id inexistente produce `KeyNotFoundException`; el nombre vacio produce `ArgumentException`. No se observa handler global para transformar esas excepciones, por lo que su codigo HTTP efectivo debe validarse antes de replicarlo en Spring.

### Products

Entidad `Product`:

- `Guid Id`.
- `Guid? CategoryId`, relacion opcional.
- `string Name`, `string? Description`.
- `decimal Price`, `int Stock`, `bool IsActive`.
- `DateTime CreatedAt`, `DateTime UpdatedAt`.
- Navegacion opcional `Category`.

Contrato:

| Metodo | Ruta | Request/query | Response |
|---|---|---|---|
| GET | `/api/products` | `search`, `sortBy`, `sortDirection`, `page` (1), `pageSize` (10) | `ProductPagedResult` |
| GET | `/api/products/{guid}` | ninguno | `ProductDto` |
| POST | `/api/products` | `{ name, description?, price, stock, isActive, categoryId? }` | `201`, `ProductDto` y `Location` |
| PUT | `/api/products/{guid}` | `{ name, description?, price, stock, isActive, categoryId? }` | `200`, `ProductDto` |
| DELETE | `/api/products/{guid}` | ninguno | `204` |

`ProductPagedResult` contiene `items`, `totalItems`, `page`, `pageSize` y `totalPages`. El DTO de salida contiene `categoryName`, no `categoryId`; el formulario Angular reconstruye `categoryId` buscando la categoria por nombre.

La busqueda compara nombre, descripcion y nombre de categoria ignorando mayusculas. El orden permite `name` (predeterminado), `price`, `stock`, `category` y `createdat`, en ascendente o descendente. El servicio valida la existencia de la categoria cuando `categoryId` tiene valor, pero permite producto sin categoria. La relacion EF usa `ON DELETE SET NULL`.

### Suppliers

Entidad `Supplier`:

- `Guid Id`.
- `string Name`, `string TaxId`.
- `string? Email`, `string? Phone`, `string? Address`.
- `bool IsActive`.
- `DateTime CreatedAt`, `DateTime UpdatedAt`.
- Coleccion de facturas como navegacion EF.

Contrato:

| Metodo | Ruta | Request | Response |
|---|---|---|---|
| GET | `/api/suppliers` | ninguno | `SupplierDto[]`, ordenado por `Name` |
| GET | `/api/suppliers/{guid}` | ninguno | `SupplierDto` |
| POST | `/api/suppliers` | `{ name, taxId, email?, phone?, address?, isActive }` | `201`, `SupplierDto` y `Location` |
| PUT | `/api/suppliers/{guid}` | `{ name, taxId, email?, phone?, address?, isActive }` | `200`, `SupplierDto` |
| DELETE | `/api/suppliers/{guid}` | ninguno | `204` |

`SupplierDto` contiene `id`, `name`, `taxId`, `email`, `phone`, `address`, `isActive` y `createdAt`. `TaxId` debe ser unico. El servicio impide eliminar un proveedor con facturas y tambien impide duplicar `TaxId`.

## 2. Angular y consumidores actuales

La configuracion actual solo tiene `environment.apiUrl = http://localhost:5000/api`. Los servicios de Categories, Products y Suppliers construyen sus rutas desde esa variable; no hay URLs hardcodeadas en componentes.

### Consumidores encontrados

- `CategoryService` es usado por `ProductFormComponent` para listar categorias y enviar `categoryId`.
- `ProductService` es usado por `ProductListComponent` y `ProductFormComponent` para listar, buscar, ordenar, paginar, crear, actualizar y eliminar.
- `SupplierService` es usado por `SupplierListComponent`, `SupplierFormComponent` y `InvoiceFormComponent`.
- `InvoiceService` es usado por `InvoiceListComponent` y `InvoiceFormComponent`.
- Auth, guards e interceptor JWT deben seguir utilizando `environment.apiUrl`.
- Invoices deben seguir utilizando `environment.apiUrl` despues de separar `catalogApiUrl`.

Las rutas Angular de Products, Suppliers e Invoices permanecen iguales y los identificadores ya estan tipados como `string`, por lo que el contrato actual basado en `Guid` puede representarse como string sin cambiar los modelos. Categories no tiene feature o ruta CRUD propia; su consumidor funcional es el formulario de Products.

El JWT interceptor agrega el token a las llamadas HTTP. Por ello, el microservicio Spring tendra que aceptar el mismo token o Angular recibira `401` al migrar los servicios de catalogo.

## 3. Dependencia Invoices -> Products, Categories, Suppliers

### Product y Category

No hay dependencia de Invoices hacia Product ni Category. `Invoice` solo contiene `SupplierId`, datos propios de factura y navegacion `Supplier`. No hay `ProductId`, lineas de factura, `CategoryId`, repository, servicio ni consulta de Product/Category en `InvoiceService`.

Por tanto, no se requiere desacoplamiento de Products o Categories para preservar Invoices.

### Supplier

Existe dependencia directa y activa:

1. `Invoice.SupplierId` es obligatorio.
2. `Invoice.Supplier` se carga con `Include` en listados y detalle.
3. La respuesta de Invoice incluye `supplierId` y `supplierName`.
4. Crear/actualizar Invoice valida que el proveedor exista y este activo.
5. Eliminar Supplier se bloquea si existen Invoices.
6. EF configura FK `Invoices.SupplierId -> Suppliers.Id` con `DeleteBehavior.Restrict`.
7. Angular carga proveedores activos desde `SupplierService` para el formulario de Invoice.

### Decision para la siguiente fase

Supplier no puede retirarse simplemente del modelo SQL junto con Categories y Products: el backend .NET dejaria de poder resolver `supplierName`, validar proveedores activos y mantener la restriccion de facturas.

La migracion debe elegir explicitamente una de estas estrategias antes de borrar las entidades .NET:

- mantener en .NET una proyeccion/tabla minima de Supplier de solo lectura para Invoices, con Spring como propietario de las escrituras; o
- cambiar Invoices para almacenar un snapshot propio (`supplierId` y `supplierName`) y validar la existencia/estado mediante una llamada controlada a Spring al crear o actualizar, evitando FK SQL.

No se recomienda dual-write. La alternativa elegida debe conservar `supplierId` y `supplierName` en el contrato de Invoice y mantener el bloqueo de eliminacion de un Supplier referenciado por facturas, o sustituirlo por una regla equivalente en el servicio propietario.

## Hallazgos que condicionan la implementacion

- Los identificadores actuales son GUID, no enteros; Angular ya los maneja como `string`.
- El contrato de Product de salida no expone `categoryId`; cambiarlo sin adaptar `ProductFormComponent` romperia la edicion.
- La autorizacion por roles forma parte del comportamiento actual y debe mantenerse en el microservicio o coordinarse mediante gateway/interceptor.
- El backend actual no tiene `UseExceptionHandler` ni `RestControllerAdvice` equivalente; los codigos de error observados desde servicios no estan normalizados en un contrato documentado.
- El seeder .NET crea cinco categorias y productos de demostracion. La migracion debe definir como importar o recrear esos datos en MongoDB sin duplicarlos.
- El nombre de la variable actual es `environment.apiUrl`; la separacion minima esperada es agregar `catalogApiUrl` y cambiar solo Category/Product/Supplier.

## Archivos revisados

- `backend/src/Api/Controllers/CategoriesController.cs`
- `backend/src/Api/Controllers/ProductsController.cs`
- `backend/src/Api/Controllers/SuppliersController.cs`
- `backend/src/Api/Controllers/InvoicesController.cs`
- `backend/src/Application/Services/CategoryService.cs`
- `backend/src/Application/Services/ProductService.cs`
- `backend/src/Application/Services/SupplierService.cs`
- `backend/src/Application/Services/InvoiceService.cs`
- `backend/src/Application/DTOs/*Dtos.cs`
- `backend/src/Domain/Entities/{Category,Product,Supplier,Invoice}.cs`
- `backend/src/Infrastructure/Data/AppDbContext.cs`
- `backend/src/Infrastructure/Data/DbSeeder.cs`
- `frontend/src/app/core/services/{category,product,supplier,invoice}.service.ts`
- `frontend/src/app/core/models/{product,supplier,invoice}.model.ts`
- features Angular de Products, Suppliers e Invoices
- `frontend/src/environments/environment.ts` y `environment.prod.ts`