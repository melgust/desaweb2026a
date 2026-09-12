package com.crobless.purchasing;

import java.time.Duration;
import java.net.http.HttpClient;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import static com.crobless.purchasing.Models.*;

@Component
public class CatalogClient {
    private final RestClient client;
    public CatalogClient(@Value("${app.catalog-url}") String url, @Value("${app.internal-key}") String key) {
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
        factory.setReadTimeout(Duration.ofSeconds(15));
        client = RestClient.builder().baseUrl(url).requestFactory(factory).defaultHeader("X-Internal-Key", key).build();
    }
    public Snapshot snapshot() { return client.get().uri("/internal/purchasing-export").retrieve().body(Snapshot.class); }
    public Map<String, Product> products() {
        var products = client.get().uri("/internal/products").retrieve().body(Product[].class);
        Map<String, Product> result = new HashMap<>();
        for (Product p : Objects.requireNonNull(products)) result.put(p.id(), p);
        return result;
    }
    public void unlinkSupplier(String id) {
        client.delete().uri("/internal/suppliers/{id}/product-links", id).retrieve().toBodilessEntity();
    }
}
