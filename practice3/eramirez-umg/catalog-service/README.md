# Catalog Service

Microservicio Spring Boot destinado exclusivamente a `Categories`, `Products` y `Suppliers`.

## Ownership de datos

MongoDB sera la fuente de verdad y el unico destino de escritura para los tres dominios migrados. El backend .NET conserva Auth, Invoices y los demas dominios no migrados.

El backend .NET ya no expone endpoints para Categories, Products o Suppliers. La entidad SQL `Supplier` se conserva internamente solo porque Invoices aun necesita resolver `SupplierId` y `SupplierName`.

No se implementara dual-write entre MySQL y MongoDB.

Existe una dependencia pendiente de resolver en la integracion: Invoices en .NET referencia `SupplierId`, muestra `SupplierName`, valida que el proveedor este activo y bloquea su eliminacion cuando tiene facturas. Por eso no se debe eliminar todavia el modelo SQL de Supplier hasta implementar el desacoplamiento compatible.

## Relaciones del catalogo

- `Product.categoryId` es una referencia simple y opcional a `Category.id`.
- Al crear o actualizar un Product con `categoryId`, el servicio debe comprobar que la categoria exista en MongoDB.
- Si se elimina una Category, los Products relacionados deben conservar un `categoryId` nulo o ser tratados mediante una regla explicita; no existe cascada MongoDB implicita.
- Product no tiene `supplierId` porque el modelo .NET actual no define esa relacion.
- Supplier mantiene su propio documento y `taxId` unico; la dependencia con Invoices se conserva fuera de este microservicio hasta resolver la integracion.

## Configuracion inicial

La URI de MongoDB se configura con `SPRING_DATA_MONGODB_URI`. En Docker debera usar el nombre del servicio, por ejemplo:

```text
mongodb://mongo:27017/catalog_db
```

El puerto HTTP se configura con `SERVER_PORT` y usa `8080` por defecto.

El origen permitido por CORS se configura con `FRONTEND_ORIGIN`. Acepta uno o varios origenes separados por comas y usa `http://localhost:4200` por defecto.

Los errores REST se devuelven con `timestamp`, `status`, `error`, `message` y `path`. Las validaciones y cuerpos JSON invalidos producen `400`; recursos inexistentes `404`; conflictos de unicidad `409`; y los errores inesperados producen `500` sin exponer stack traces.

El endpoint de salud es `GET /actuator/health`. Compose lo utiliza para marcar saludable el contenedor de Spring antes de iniciar el frontend.

Al iniciar, `CatalogDataInitializer` inserta datos demo solo si cada coleccion esta vacia: cinco categorias, cinco productos y dos proveedores. El proceso es idempotente y no duplica datos al reiniciar con el volumen de MongoDB existente.

## Endpoints implementados

| Metodo | Ruta | Comportamiento |
|---|---|---|
| GET | `/api/categories` | Lista categorias ordenadas por nombre |
| GET | `/api/categories/{id}` | Obtiene una categoria |
| POST | `/api/categories` | Crea una categoria |
| PUT | `/api/categories/{id}` | Actualiza una categoria |
| DELETE | `/api/categories/{id}` | Elimina una categoria y desvincula sus productos |
| GET | `/api/products` | Lista productos con busqueda, ordenamiento y paginacion |
| GET | `/api/products/{id}` | Obtiene un producto |
| POST | `/api/products` | Crea un producto y valida `categoryId` |
| PUT | `/api/products/{id}` | Actualiza un producto y valida `categoryId` |
| DELETE | `/api/products/{id}` | Elimina un producto |
| GET | `/api/suppliers` | Lista proveedores ordenados por nombre |
| GET | `/api/suppliers/{id}` | Obtiene un proveedor |
| POST | `/api/suppliers` | Crea un proveedor con `taxId` unico |
| PUT | `/api/suppliers/{id}` | Actualiza un proveedor con `taxId` unico |
| DELETE | `/api/suppliers/{id}` | Elimina un proveedor |