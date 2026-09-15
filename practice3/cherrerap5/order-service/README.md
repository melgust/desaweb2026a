# Order Service

Node.js 22+, TypeScript estricto, Express 5, Redis oficial y Zod. Redis es la fuente
de verdad de los borradores; Node orquesta su confirmación en .NET. La API no
almacena facturas ni mantiene productos/proveedores.

## Ejecutar y probar

```sh
npm ci
# Copiar .env.example a .env y configurar JWT_SECRET igual que Jwt__Key de .NET.
npm run dev
```

`npm run build`, `npm run lint`, `npm test` y `npm run test:e2e`.
Con `REDIS_TEST_URL=redis://localhost:6379`, las pruebas incluyen Redis real.
El E2E requiere .NET, catálogo y Redis activos y una cuenta sin pedido previo.

## API

| Método | Ruta | Cuerpo |
| --- | --- | --- |
| GET | `/api/orders/current` | — |
| POST | `/api/orders/items` | `{productId,supplierId,quantity}` |
| PUT | `/api/orders/items/:productId` | `{quantity}` |
| DELETE | `/api/orders/items/:productId` | — |
| DELETE | `/api/orders/current` | — |
| POST | `/api/orders/confirm` | `{}` |
| GET | `/health` | — |

Todos los endpoints de pedidos requieren el JWT HS256 emitido por .NET, con issuer,
audience y expiración válidos. Se utiliza la identidad del claim .NET NameIdentifier
o sus equivalentes `nameid/sub`. Solo Admin/Manager pueden confirmar.

IDs UUID y ObjectId son válidos: el catálogo inicial usa UUID y otros documentos
usan ObjectId. Cantidades enteras de 1 a 100000; hasta 100 productos. POST incrementa
duplicados; un proveedor distinto para la misma línea devuelve 409. PUT con cero
es inválido; DELETE elimina la línea. El servidor calcula todos los importes.

## Persistencia y confirmación

Un JSON en `order:draft:user:{userId}` tiene UUID, timestamps, estado, líneas,
subtotal y total. Cada modificación válida utiliza `SET ... EX 86400` dentro de
Lua; leer no renueva. El bloqueo Redis de 120 segundos verifica su propietario
antes de escribir o borrar. Los comandos de producción tienen timeout de 3 segundos.

Confirmar revalida las referencias, congela el borrador con `CONFIRMING/KEEPTTL`
y llama `POST .NET /api/invoices/from-order` con el JWT original y
`{orderId,items:[{productId,supplierId,quantity}]}`. .NET obtiene los precios del
catálogo y crea **una factura con varias líneas**, dentro de una transacción.
La respuesta pública es `{orderId,invoice}`; `invoice.items[]` contiene las líneas.

Los precios del carrito son una referencia tomada al agregar/modificar; el precio
definitivo se valida en .NET al confirmar. Los datos históricos se conservan en
MySQL. Una clave única y una huella de los productos/cantidades impiden que un
reintento duplique la factura o cambie el contenido de una confirmación previa.

Después del éxito se elimina el borrador inmediatamente. Ante timeout/5xx se
conserva congelado y se permite reintentar la confirmación. Un 4xx definitivo
restaura DRAFT. Los errores nunca renuevan el TTL. No existe escritura alternativa
en memoria cuando Redis falla y no se usan tareas periódicas de eliminación.

`NODE_ENV=test` permite un `ORDER_TTL_SECONDS` corto; fuera de pruebas debe ser
86400. `expiresAt` proviene del servidor y el TTL nativo es la autoridad.

Más detalles, puertos, migración, Angular y resultados: [README principal](../README.md).
