package com.enterprise.catalog.repository;

import java.util.Collection;

import org.springframework.data.domain.Page;

import com.enterprise.catalog.model.Product;

public interface ProductSearchRepository {
    Page<Product> search(String search, String categoryId, Collection<String> categoryIdsByName,
                         String sortBy, String sortDirection, int page, int pageSize);
}
