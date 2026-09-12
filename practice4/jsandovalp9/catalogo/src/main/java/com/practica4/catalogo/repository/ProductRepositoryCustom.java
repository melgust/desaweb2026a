package com.practica4.catalogo.repository;

import com.practica4.catalogo.entity.Product;
import com.practica4.catalogo.entity.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductRepositoryCustom {

    Page<Product> findAll(ProductStatus status, String sku, String search, Pageable pageable);
}
