package com.crobless.purchasing;

import static com.crobless.purchasing.Models.*;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;
import java.util.Locale;
import org.bson.Document;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

@Component
public class LegacyImport implements ApplicationRunner {
    private final PurchasingService service;
    private final CatalogClient catalog;
    public LegacyImport(PurchasingService service, CatalogClient catalog) { this.service = service; this.catalog = catalog; }
    @Override public void run(ApplicationArguments args) throws Exception {
        var mongo = service.mongo;
        for (String collection : new String[]{"suppliers", "invoices", "coordination", "product_tombstones", "migrations"}) {
            if (!mongo.collectionExists(collection)) mongo.createCollection(collection);
        }
        mongo.indexOps(Invoice.class).createIndex(new Index().on("numberKey", Sort.Direction.ASC).unique());
        mongo.indexOps(Invoice.class).createIndex(new Index().on("supplierId", Sort.Direction.ASC));
        mongo.indexOps(Invoice.class).createIndex(new Index().on("items.productId", Sort.Direction.ASC));
        mongo.upsert(query(where("_id").is("references")), new Update().setOnInsert("revision", 0), "coordination");
        if (!mongo.exists(query(where("_id").is("mysql-v1")), "migrations")) {
            Snapshot snapshot = null;
            for (int attempt = 0; attempt < 30; attempt++) {
                try { snapshot = catalog.snapshot(); break; }
                catch (org.springframework.web.client.RestClientException e) {
                    if (attempt == 29) throw e;
                    Thread.sleep(1000);
                }
            }
            final Snapshot data = java.util.Objects.requireNonNull(snapshot);
            service.atomic(() -> {
                if (mongo.exists(query(where("_id").is("mysql-v1")), "migrations")) return null;
                for (var supplier : data.suppliers()) mongo.insert(supplier);
                for (var invoice : data.invoices()) {
                    invoice.numberKey = invoice.invoiceNumber.trim().toLowerCase(Locale.ROOT);
                    mongo.insert(invoice);
                }
                mongo.insert(new Document("_id", "mysql-v1").append("suppliers", data.suppliers().size())
                    .append("invoices", data.invoices().size()).append("completedAt", new java.util.Date()), "migrations");
                return null;
            });
            LoggerFactory.getLogger(getClass()).info("Imported {} suppliers and {} invoices from the read-only .NET archive", data.suppliers().size(), data.invoices().size());
        }
        service.ready = true;
    }
}
