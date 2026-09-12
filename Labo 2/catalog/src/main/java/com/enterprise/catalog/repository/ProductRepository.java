package com.enterprise.catalog.repository;

import com.enterprise.catalog.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ProductRepository extends MongoRepository<Product, String> {
    Page<Product> findByNameContainingIgnoreCase(String search, Pageable pageable);
    long countByCategory_Id(String categoryId);
}
