package com.example.catalog.catalog.repository;

import com.example.catalog.catalog.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

/**
 * Persistence access for {@link Product}. Contains only persistence concerns.
 *
 * <p>Extends {@link JpaSpecificationExecutor} so the service can build dynamic
 * filter queries (status / sku / search) without writing SQL.</p>
 */
public interface ProductRepository
        extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    boolean existsBySku(String sku);

    boolean existsBySlug(String slug);

    Optional<Product> findBySku(String sku);

    Optional<Product> findBySlug(String slug);
}
