# Relaciones del catálogo en MongoDB

## Product y Category

`Product` almacena `categoryId` como identificador simple de un documento de la colección `categories`.

No se utiliza `@DBRef` ni se embebe Category completa porque:

- el contrato actual filtra productos por `categoryId`;
- Category tiene ciclo de vida propio;
- el nombre de categoría se resuelve al construir el DTO de respuesta;
- se evita duplicar información mutable dentro de cada producto.

`categoryId` tiene un índice no único para conservar un filtro eficiente equivalente al índice SQL actual.

Cuando se implementen las escrituras del servicio, crear y actualizar Product deberán comprobar que Category exista y que `isActive` sea verdadero. Una referencia inválida deberá rechazar la operación completa, sin guardar parcialmente el producto.

## Product y Supplier

El modelo actual no relaciona Product directamente con Supplier. No se agrega `supplierId` a Product porque hacerlo cambiaría el contrato y añadiría una regla de negocio inexistente.

Product y Supplier participan por separado en Invoice. Invoice continúa bajo ownership del backend .NET y no forma parte de los documentos del catálogo.

## Eliminación de Category

El backend actual solo permite listar categorías y no expone eliminación. Por ello, Catalog Service no necesita definir todavía una política pública de borrado de Category. Si una fase posterior agrega ese endpoint, deberá impedir referencias huérfanas o conservar una semántica explícita compatible con el sistema.

## Eliminación de Product y Supplier

Las referencias históricas de Invoice no se modelarán como relaciones MongoDB. Antes del corte de ownership, Invoice deberá conservar sus propios campos `productId`, `productName`, `supplierId` y `supplierName` para que la consulta histórica no dependa de documentos mutables o eliminados.
