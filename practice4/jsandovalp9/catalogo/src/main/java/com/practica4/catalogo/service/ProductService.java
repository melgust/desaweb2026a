package com.practica4.catalogo.service;

import com.practica4.catalogo.dto.ProductRequest;
import com.practica4.catalogo.dto.ProductResponse;
import com.practica4.catalogo.dto.ProductSummaryResponse;
import com.practica4.catalogo.entity.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ProductService {

    ProductResponse create(ProductRequest request);

    ProductResponse getById(UUID id);

    Page<ProductSummaryResponse> findAll(ProductStatus status, String sku, String search, Pageable pageable);

    ProductResponse update(UUID id, ProductRequest request);

    void delete(UUID id);
}
