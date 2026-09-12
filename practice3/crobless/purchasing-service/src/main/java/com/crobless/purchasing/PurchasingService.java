package com.crobless.purchasing;

import static com.crobless.purchasing.Models.*;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;
import static org.springframework.http.HttpStatus.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;
import java.util.function.Supplier;
import java.util.regex.Pattern;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PurchasingService {
    final MongoTemplate mongo;
    private final CatalogClient catalog;
    private final TransactionTemplate transactions;
    final BigDecimal taxRate;
    volatile boolean ready;
    public PurchasingService(MongoTemplate mongo, CatalogClient catalog, PlatformTransactionManager manager,
                             @Value("${app.tax-rate}") BigDecimal taxRate) {
        this.mongo = mongo; this.catalog = catalog; this.transactions = new TransactionTemplate(manager); this.taxRate = taxRate;
    }
    void checkReady() { if (!ready) throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Migración inicial en curso."); }
    static String id(String value) {
        if (value == null || !value.matches("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"))
            throw new IllegalArgumentException("Invalid UUID");
        return UUID.fromString(value).toString();
    }
    // Serialize reference-changing transactions using a shared write. Mongo detects concurrent writes;
    // a conflicting operation returns 409, without partially persisting an invoice or deleting a reference.
    <T> T atomic(Supplier<T> operation) {
        return transactions.execute(status -> {
            mongo.updateFirst(query(where("_id").is("references")), new Update().inc("revision", 1), "coordination");
            return operation.get();
        });
    }
    public List<Models.Supplier> directory() {
        checkReady();
        return mongo.find(query(where("deleted").ne(true)).with(Sort.by("name")), Models.Supplier.class);
    }
    public SupplierPage suppliers(String search, String sortBy, String sortDirection, int page, int pageSize) {
        checkReady();
        if (page < 1 || pageSize < 1 || pageSize > 500) throw new IllegalArgumentException("Invalid pagination");
        var criteria = where("deleted").ne(true);
        if (search != null && !search.isBlank()) {
            var pattern = Pattern.compile(Pattern.quote(search), Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
            criteria = criteria.andOperator(new Criteria().orOperator(where("name").regex(pattern), where("contactEmail").regex(pattern)));
        }
        long count = mongo.count(query(criteria), Models.Supplier.class);
        String field = switch (sortBy == null ? "" : sortBy.toLowerCase(Locale.ROOT)) {
            case "contactemail" -> "contactEmail"; case "createdat" -> "createdAt"; default -> "name";
        };
        var direction = "desc".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC : Sort.Direction.ASC;
        var items = mongo.find(query(criteria).with(Sort.by(direction, field).and(Sort.by("id")))
            .skip((long)(page - 1) * pageSize).limit(pageSize), Models.Supplier.class);
        return new SupplierPage(items, count, page, pageSize, (count + pageSize - 1) / pageSize);
    }
    public Models.Supplier supplier(String value) {
        checkReady();
        var supplier = mongo.findById(id(value), Models.Supplier.class);
        if (supplier == null || supplier.deleted) throw new ResponseStatusException(NOT_FOUND, "Proveedor no encontrado.");
        return supplier;
    }
    public Models.Supplier saveSupplier(String value, SupplierRequest request) {
        checkReady();
        return atomic(() -> {
            var supplier = value == null ? new Models.Supplier() : supplier(value);
            if (value == null) { supplier.id = UUID.randomUUID().toString(); supplier.createdAt = Instant.now(); }
            supplier.name = request.name().trim(); supplier.contactEmail = request.contactEmail();
            supplier.phone = request.phone(); supplier.isActive = request.isActive(); supplier.updatedAt = Instant.now();
            return mongo.save(supplier);
        });
    }
    public void deleteSupplier(String value) {
        checkReady(); String id = id(value);
        atomic(() -> {
            var supplier = mongo.findById(id, Models.Supplier.class);
            if (supplier == null) throw new ResponseStatusException(NOT_FOUND, "Proveedor no encontrado.");
            if (mongo.exists(query(where("supplierId").is(id)), Invoice.class))
                throw new ResponseStatusException(BAD_REQUEST, "No se puede eliminar un proveedor utilizado por facturas.");
            supplier.deleted = true; supplier.isActive = false; mongo.save(supplier);
            return null;
        });
        // Idempotent tombstone: if catalog is unavailable, DELETE can be retried safely.
        catalog.unlinkSupplier(id);
    }
    public List<Invoice> invoices() {
        checkReady();
        return mongo.find(new Query().with(Sort.by(Sort.Direction.DESC, "invoiceDate").and(Sort.by("invoiceNumber"))), Invoice.class);
    }
    public Invoice invoice(String value) {
        checkReady(); var result = mongo.findById(id(value), Invoice.class);
        if (result == null) throw new ResponseStatusException(NOT_FOUND, "Factura no encontrada.");
        return result;
    }
    static BigDecimal lineTotal(int quantity, BigDecimal price) {
        return price.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
    }
    public Invoice saveInvoice(String value, InvoiceRequest request) {
        checkReady();
        if (request.invoiceDate().isBefore(LocalDate.of(1000, 1, 1)) || request.invoiceDate().isAfter(LocalDate.of(9999, 12, 31)))
            throw new IllegalArgumentException("Invalid date");
        return atomic(() -> {
            var invoice = value == null ? new Invoice() : invoice(value);
            var supplier = mongo.findById(id(request.supplierId()), Models.Supplier.class);
            if (supplier == null || supplier.deleted)
                throw new ResponseStatusException(BAD_REQUEST, "El proveedor no existe.");
            var products = catalog.products();
            List<Detail> items = new ArrayList<>();
            for (var item : request.items()) {
                String productId = id(item.productId());
                var product = products.get(productId);
                if (product == null || mongo.exists(query(where("_id").is(productId)), "product_tombstones"))
                    throw new ResponseStatusException(BAD_REQUEST, "El producto no existe o está siendo eliminado.");
                items.add(new Detail(UUID.randomUUID().toString(), productId, product.name(), item.quantity(),
                    item.unitPrice().setScale(2), lineTotal(item.quantity(), item.unitPrice())));
            }
            if (value == null) { invoice.id = UUID.randomUUID().toString(); invoice.createdAt = Instant.now(); }
            invoice.invoiceNumber = request.invoiceNumber().trim(); invoice.numberKey = invoice.invoiceNumber.toLowerCase(Locale.ROOT);
            invoice.invoiceDate = request.invoiceDate(); invoice.supplierId = supplier.id; invoice.supplierName = supplier.name;
            invoice.notes = request.notes(); invoice.items = items;
            invoice.subtotal = items.stream().map(Detail::subtotal).reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2);
            invoice.tax = invoice.subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
            invoice.total = invoice.subtotal.add(invoice.tax);
            if (invoice.total.compareTo(new BigDecimal("9999999999999999.99")) > 0) throw new IllegalArgumentException("Total too large");
            return mongo.save(invoice);
        });
    }
    public void deleteInvoice(String value) {
        checkReady(); atomic(() -> { mongo.remove(invoice(value)); return null; });
    }
    public void reserveProductDeletion(String value) {
        checkReady(); String id = id(value);
        atomic(() -> {
            if (mongo.exists(query(where("items.productId").is(id)), Invoice.class))
                throw new ResponseStatusException(BAD_REQUEST, "No se puede eliminar un producto utilizado por facturas.");
            mongo.upsert(query(where("_id").is(id)), new Update().set("blocked", true), "product_tombstones");
            return null;
        });
    }
}
