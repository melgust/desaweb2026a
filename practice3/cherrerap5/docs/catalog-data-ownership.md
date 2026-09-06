# Ownership de datos del catálogo

## Estado

Decisión aprobada para la migración parcial del catálogo. Este documento define el límite de datos que deberán respetar las siguientes fases de implementación.

## Responsabilidades

| Dominio | Servicio propietario | Fuente de verdad | Escrituras permitidas |
|---|---|---|---|
| Authentication | Backend .NET | MySQL | Backend .NET |
| Users and roles | Backend .NET | MySQL | Backend .NET |
| Invoices | Backend .NET | MySQL | Backend .NET |
| Categories | Catalog Service | MongoDB | Catalog Service |
| Products | Catalog Service | MongoDB | Catalog Service |
| Suppliers | Catalog Service | MongoDB | Catalog Service |

Cuando la migración entre en operación, MongoDB será la única fuente de verdad para categorías, productos y proveedores. El backend .NET no expondrá operaciones CRUD ni escribirá copias de esas entidades en MySQL.

## Límite de las APIs

El frontend utilizará dos URLs configurables:

- `apiUrl`: autenticación y facturas en el backend .NET.
- `catalogApiUrl`: categorías, productos y proveedores en Catalog Service.

Las rutas públicas del catálogo conservarán los contratos actuales bajo:

- `/api/categories`
- `/api/products`
- `/api/suppliers`

No habrá endpoints activos duplicados para estos dominios en .NET y Spring Boot al finalizar el cambio de ownership.

## Política de escritura

Queda prohibido implementar dual-write entre MySQL y MongoDB. En particular:

- una creación o modificación del catálogo se confirma únicamente después de persistirse en MongoDB;
- el backend .NET no replica esa escritura en las tablas SQL antiguas;
- Catalog Service no escribe datos de autenticación ni facturas;
- una falla de MongoDB no debe provocar una escritura alternativa en MySQL;
- los datos SQL antiguos del catálogo serán únicamente una fuente de migración y dejarán de ser datos operativos.

## Transición de ownership

El cambio se realizará mediante un corte controlado:

1. Crear Catalog Service y validar sus contratos sin dirigir aún el frontend hacia él.
2. Importar o inicializar en MongoDB los datos necesarios de categorías, productos y proveedores de manera idempotente.
3. Desacoplar Invoice de las entidades SQL mutables de Product y Supplier.
4. Detener las escrituras del catálogo en .NET.
5. Cambiar Angular para consumir `catalogApiUrl`.
6. Ejecutar pruebas funcionales de catálogo, autenticación y facturas.
7. Eliminar controllers, services y persistencia .NET que ya no tengan consumidores.

No se habilitará el paso 5 mientras Invoice dependa de claves foráneas o validaciones contra las tablas SQL de Product y Supplier.

## Facturas y datos históricos

Invoice continúa siendo propiedad de .NET y MySQL. Una factura representa un registro histórico y no debe depender de que un producto o proveedor mutable siga existiendo en MongoDB.

El modelo objetivo mínimo de Invoice conservará:

- `productId`: identificador externo del producto del catálogo;
- `productName`: nombre del producto al registrar la factura;
- `supplierId`: identificador externo del proveedor del catálogo;
- `supplierName`: nombre del proveedor al registrar la factura;
- `unitPrice` y `quantity`: valores históricos propios de la factura.

Los identificadores externos deberán almacenarse como texto para admitir IDs de MongoDB sin acoplar .NET a `ObjectId`. Las claves foráneas SQL hacia Product y Supplier deberán retirarse solo después de respaldar los nombres históricos necesarios.

Para crear o actualizar una factura, .NET podrá validar Product y Supplier mediante una lectura síncrona a Catalog Service. Esa lectura no transfiere ownership y no constituye dual-write. Si Catalog Service no está disponible o la referencia no existe/está inactiva, la operación de factura deberá rechazarse sin escribir parcialmente.

Las consultas de facturas existentes usarán los nombres almacenados en Invoice y no requerirán una consulta al catálogo. Esto conserva el historial aunque cambie o se elimine el documento original.

## Identificadores

La API seguirá exponiendo identificadores como `string` JSON. MongoDB podrá utilizar `ObjectId` serializado como cadena o UUID en forma de cadena; esa decisión interna no deberá cambiar el contrato Angular.

Durante la importación se recomienda conservar los GUID actuales como IDs de cadena cuando sea posible. Esto reduce cambios en enlaces existentes y facilita desacoplar las referencias de facturas.

## Relaciones dentro del catálogo

- Product conservará `categoryId` como referencia simple.
- Al crear o actualizar Product, Catalog Service comprobará que Category exista y esté activa.
- Product no posee actualmente una relación directa con Supplier; no se agregará una relación nueva.
- Supplier y Product solo coinciden actualmente en el contexto de Invoice, cuyo ownership permanece en .NET.

## Lecturas y consistencia

- Catalog Service resuelve `categoryName` al construir respuestas de Product.
- El listado, búsqueda, filtros, ordenamiento y paginación de productos se ejecutan exclusivamente sobre MongoDB.
- El listado de proveedores se ejecuta exclusivamente sobre MongoDB.
- Las facturas se consultan exclusivamente desde MySQL usando sus datos históricos.
- No se realizarán joins distribuidos durante las consultas de listado.

## Condición para retirar el código SQL antiguo

Las tablas y clases SQL de Category, Product y Supplier no se eliminarán hasta cumplir simultáneamente:

- MongoDB contiene los datos requeridos;
- Angular usa Catalog Service para los tres dominios;
- Invoice ya no tiene claves foráneas ni navegaciones EF hacia Product o Supplier;
- creación, edición y consulta de facturas funcionan con referencias externas y datos históricos;
- no quedan referencias de compilación desde Auth, Invoice u otros módulos;
- las pruebas funcionales y compilaciones de ambos backends y Angular pasan.

Hasta entonces, la presencia temporal del modelo SQL sirve únicamente para una transición segura; no debe habilitarse escritura concurrente desde ambas implementaciones.
