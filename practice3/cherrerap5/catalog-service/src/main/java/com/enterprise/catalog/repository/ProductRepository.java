package com.enterprise.catalog.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.enterprise.catalog.model.Product;

public interface ProductRepository extends MongoRepository<Product, String>, ProductSearchRepository {
}
