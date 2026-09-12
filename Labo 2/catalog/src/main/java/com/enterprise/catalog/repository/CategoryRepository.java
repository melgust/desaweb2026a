package com.enterprise.catalog.repository;

import com.enterprise.catalog.model.Category;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface CategoryRepository extends MongoRepository<Category, String> {
    boolean existsByNameIgnoreCase(String name);
    Optional<Category> findByNameIgnoreCase(String name);
}
