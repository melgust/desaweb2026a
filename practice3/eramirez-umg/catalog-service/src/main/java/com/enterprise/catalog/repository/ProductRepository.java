package com.enterprise.catalog.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.enterprise.catalog.model.Product;

public interface ProductRepository extends MongoRepository<Product, String> {
	List<Product> findAllByCategoryId(String categoryId);
}