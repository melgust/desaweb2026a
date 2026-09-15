# Entrega — fases 16–35 y facturas de varias líneas

## Arquitectura implementada

Angular → Order Service (Node.js/TypeScript) → Redis para pedidos temporales.
Order Service → .NET → MySQL para **una factura con varios productos**.
Spring Boot/MongoDB conserva productos, categorías y proveedores.

## Archivos creados

- `frontend/src/app/core/models/order.model.ts` y `core/services/order.service.ts`.
- `frontend/src/app/features/orders/order.component.ts`.
- `frontend/src/app/features/invoices/invoice-detail.component.ts`.
- `frontend/e2e/orders.spec.ts` y `frontend/playwright.config.ts`.
- `backend/src/Api/Migrations/20260915040641_InvoiceLineItems.cs` y su Designer.
- `backend/tests/InvoiceService.Tests/`: proyecto, pruebas de facturas y migración.
- `order-service/tests/live.e2e.ts`; pruebas unitarias/HTTP y Redis ampliadas.
- `docker-compose.ca.yml` y `scripts/configure-build-trust.ps1` para certificados
  públicos de confianza opcionales en compilaciones Docker.

## Archivos modificados

- Entidades, DTOs, InvoiceService, CatalogClient, InvoicesController, DbContext,
  snapshot de migraciones, Program y configuración de .NET.
- Modelos, formulario/listado de facturas, listado de productos, rutas, menú,
  interceptor JWT, entornos, cliente de catálogo y configuración de Angular.
- Clientes de catálogo/facturas, TTL configurable en pruebas y validadores de Node.
- Dockerfiles, Compose, Nginx, .gitignore, README y documentación de dominios.
- El servicio Angular provisional de `features/orders/order.service.ts` fue
  sustituido por el servicio compartido de `core/services`, sin dejar dos clientes.

## API Order Service

GET current; POST items; PUT/DELETE items/:productId; DELETE current; POST confirm.
GET `/health` verifica Redis PING. Las rutas de pedidos exigen JWT de .NET.
Confirmar responde `{orderId,invoice}`; `invoice.items[]` contiene todos los productos.
Los identificadores admiten tanto UUID de los datos iniciales como ObjectId.

## Integración con Redis

Un carrito por identidad JWT, JSON y bloqueo por usuario. Escrituras/borrados
comprueban el propietario del bloqueo mediante Lua. Redis es la única fuente de
verdad temporal. AOF conserva los datos y sus vencimientos al reiniciar.

## TTL y expiración

86400 segundos desde la última modificación válida, usando expiración nativa.
GET y errores no renuevan TTL; la confirmación usa KEEPTTL y elimina con DEL solo
tras éxito. Las pruebas comprobaron expiración natural con TTL de un segundo,
sin tareas de eliminación. Los TTL distintos de 86400 solo se aceptan en modo test.

## Integración Angular

Agregar desde Products con cantidad/proveedor, contador de unidades en el menú,
carrito editable, confirmación previa, manejo de errores y expiración. El éxito
abre `/invoices/:id` con un mensaje y limpia el estado únicamente después del HTTP.
El formulario de facturas admite agregar y eliminar líneas; conserva el CRUD y roles.
Nginx publica las tres APIs bajo el mismo origen. El interceptor limita destinos JWT.

## Integración con facturas

`Invoice` es la cabecera; `InvoiceItem` contiene cada producto, proveedor, nombres
históricos, cantidad, precio y subtotal. La migración preserva facturas anteriores
copiando sus datos a una línea antes de retirar las columnas antiguas.

La confirmación obtiene precios del catálogo en .NET. Una clave única derivada de
usuario + pedido y una huella del contenido permiten recuperar la misma factura
ante reintentos. Las facturas de pedidos se eliminan lógicamente para no perder
esta garantía. Guardar una cabecera y todas sus líneas es una operación atómica.

## Docker

Se ejecutaron `docker compose config --quiet`, `docker compose up -d --build`
y `docker compose ps`. Los siete servicios quedaron **healthy**: frontend, backend,
catalog-service, order-service, Redis, MySQL y MongoDB.

Las descargas necesitaron los certificados públicos ya confiados por Windows.
Se proporcionaron mediante secretos temporales de BuildKit, con TLS verificado;
el override y los certificados de esta máquina están excluidos de Git.

## Pruebas realizadas

| Verificación | Resultado |
| --- | --- |
| TypeScript Node, build | Correcto |
| ESLint Node | Correcto |
| Node: unitarias, HTTP y Redis real | 24 correctas, ninguna omitida |
| E2E API con .NET/MySQL, catálogo y Redis reales | 1 correcto |
| .NET: facturas y migración MySQL real | 13 correctas, ninguna omitida |
| Angular, build producción | Correcto, sin advertencias |
| Playwright/Chromium | 2 correctas |
| Catálogo, Maven dentro de Docker | 7 correctas y paquete generado |
| EF Core: cambios del modelo sin migración | Ninguno |
| Compose: configuración, build y arranque | Correctos |

El E2E API verificó login, productos A×2/B×1, totales, TTL cercano a 86400,
modificación A×3 y renovación, una sola factura con dos líneas, DEL inmediato,
consulta definitiva y reintento sin duplicados. Después creó otro carrito y
comprobó su TTL. Los datos creados por las pruebas se retiraron al terminar.

El navegador verificó agregar dos productos, contador, modificación, confirmación,
navegación a la factura y edición de una factura con dos líneas. Otra prueba
simuló un error 503 y una respuesta 404 para verificar conservación del carrito
ante fallos y limpieza del estado al expirar.

La prueba de migración usó una base MySQL temporal `invtest_<UUID>`, creó una
factura con el esquema anterior, aplicó la migración y comprobó identidad,
número, fecha, estado, nombres, cantidad y montos. La base temporal fue eliminada.

## Cómo ejecutar

La aplicación quedó disponible en **http://localhost:81**. Iniciar sesión nuevamente
para usar la clave JWT local configurada. En futuras ejecuciones:

```sh
cd practice3/cherrerap5
docker compose up -d --build
```

Consultar el [README principal](../README.md) para desarrollo local, pruebas,
variables y configuración de certificados.

## Decisiones técnicas importantes

- Una factura admite múltiples proveedores mediante sus líneas, porque el catálogo
  no define relación directa producto-proveedor.
- Los importes del carrito se calculan en servidor; los precios definitivos se
  consultan en .NET al confirmar. Las facturas manuales siguen admitiendo precios
  introducidos por Admin/Manager.
- Un timeout conserva un borrador congelado que permite reintentar confirmación.
- No se transforma automáticamente una factura multíproducto al esquema antiguo:
  se requiere restaurar un respaldo para un rollback sin pérdida de datos.
- Antes de aplicar la migración se guardó
  `.local/backups/before-invoice-lines.sql`, excluido de Git.
- No se cambiaron las tecnologías ni la propiedad de catálogo, autenticación o
  facturas. No se almacenan borradores en MySQL/MongoDB.

## Cobertura de las fases 16–35

| Fases | Entrega |
| --- | --- |
| 16–18 | Servicio Angular compartido, agregar desde productos y vista de carrito |
| 19–22 | Expiración visible, 404, confirmación, navegación y contador |
| 23–25 | Contratos, modelos, interceptores, CORS/Nginx y responsabilidades |
| 26–28 | Casos límite, JWT, validación de montos y pruebas |
| 29–30 | README, contratos y ejemplos de entorno sin claves privadas |
| 31–32 | Compose saludable y escenarios completos con infraestructura real |
| 33–35 | Separación de responsabilidades, migración compatible, builds e informe |
