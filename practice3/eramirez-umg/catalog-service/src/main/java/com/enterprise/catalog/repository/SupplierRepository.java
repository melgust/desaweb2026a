package com.enterprise.catalog.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.enterprise.catalog.model.Supplier;

public interface SupplierRepository extends MongoRepository<Supplier, String> {
	List<Supplier> findAllByOrderByNameAsc();

	Optional<Supplier> findByTaxId(String taxId);
}