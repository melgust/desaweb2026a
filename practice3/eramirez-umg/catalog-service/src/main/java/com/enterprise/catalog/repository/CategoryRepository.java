package com.enterprise.catalog.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.enterprise.catalog.model.Category;

public interface CategoryRepository extends MongoRepository<Category, String> {
	List<Category> findAllByOrderByNameAsc();

	Optional<Category> findByNameIgnoreCase(String name);
}