package com.example.catalog.catalog.repository;

import com.example.catalog.catalog.entity.Product;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Persistence access for Product using MongoDB.
 */
public interface ProductRepository extends MongoRepository<Product, UUID> {

    boolean existsBySku(String sku);

    boolean existsBySlug(String slug);

    Optional<Product> findBySku(String sku);

    Optional<Product> findBySlug(String slug);
}