package com.example.catalog.catalog.service;

import com.example.catalog.catalog.dto.ProductRequest;
import com.example.catalog.catalog.dto.ProductResponse;
import com.example.catalog.catalog.dto.ProductSummaryResponse;
import com.example.catalog.catalog.entity.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Business operations for the product catalog.
 */
public interface ProductService {

    ProductResponse create(ProductRequest request);

    ProductResponse getById(UUID id);

    Page<ProductSummaryResponse> findAll(
            ProductStatus status,
            String sku,
            String search,
            Pageable pageable);

    ProductResponse update(UUID id, ProductRequest request);

    void delete(UUID id);
}
