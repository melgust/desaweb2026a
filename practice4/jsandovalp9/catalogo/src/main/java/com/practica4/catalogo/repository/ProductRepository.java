package com.practica4.catalogo.repository;

import com.practica4.catalogo.entity.Product;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends MongoRepository<Product, UUID>, ProductRepositoryCustom {

    boolean existsBySku(String sku);

    boolean existsBySlug(String slug);

    Optional<Product> findBySku(String sku);

    Optional<Product> findBySlug(String slug);
}
