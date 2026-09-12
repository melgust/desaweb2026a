package com.example.catalog.catalog.repository;

import com.example.catalog.catalog.entity.Product;
import com.example.catalog.catalog.entity.ProductStatus;
import com.example.catalog.support.AbstractPostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Repository slice test running against a real PostgreSQL container. Flyway
 * builds the schema; Hibernate validates against it. H2 is never used.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ProductRepositoryTest extends AbstractPostgresIntegrationTest {

    @Autowired
    private ProductRepository productRepository;

    private Product newProduct(String sku, String slug) {
        Product product = new Product();
        product.setId(UUID.randomUUID());
        product.setSku(sku);
        product.setSlug(slug);
        product.setName("Product " + sku);
        product.setPrice(new BigDecimal("10.0000"));
        product.setCurrency("USD");
        product.setStatus(ProductStatus.ACTIVE);
        return product;
    }

    @Test
    void savesAndFindsBySku() {
        productRepository.save(newProduct("SKU-A", "slug-a"));

        assertThat(productRepository.existsBySku("SKU-A")).isTrue();
        assertThat(productRepository.findBySku("SKU-A")).isPresent();
        assertThat(productRepository.findBySlug("slug-a")).isPresent();
    }

    @Test
    void existsBySlugReturnsFalseWhenMissing() {
        assertThat(productRepository.existsBySlug("does-not-exist")).isFalse();
    }

    @Test
    void assignsAuditTimestampsAndVersionOnSave() {
        Product saved = productRepository.saveAndFlush(newProduct("SKU-B", "slug-b"));

        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
        assertThat(saved.getVersion()).isNotNull();
    }
}
