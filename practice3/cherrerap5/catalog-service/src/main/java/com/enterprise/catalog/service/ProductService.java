package com.enterprise.catalog.service;

import com.enterprise.catalog.dto.ProductDto;
import com.enterprise.catalog.dto.ProductPagedResult;
import com.enterprise.catalog.dto.SaveProductRequest;

public interface ProductService {
    ProductPagedResult getProducts(String search, String categoryId, String sortBy, String sortDirection,
                                   int page, int pageSize);
    ProductDto getById(String id);
    ProductDto create(SaveProductRequest request);
    ProductDto update(String id, SaveProductRequest request);
    void delete(String id);
}
