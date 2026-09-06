package com.enterprise.catalog.mapper;

import com.enterprise.catalog.dto.CategoryDto;
import com.enterprise.catalog.dto.ProductDto;
import com.enterprise.catalog.dto.SupplierDto;
import com.enterprise.catalog.model.Category;
import com.enterprise.catalog.model.Product;
import com.enterprise.catalog.model.Supplier;

public final class CatalogMapper {

    private CatalogMapper() {
    }

    public static CategoryDto toDto(Category category) {
        return new CategoryDto(category.getId(), category.getName(), category.getDescription(), category.isActive());
    }

    public static ProductDto toDto(Product product, String categoryName) {
        return new ProductDto(product.getId(), product.getName(), product.getDescription(), product.getPrice(),
                product.getStock(), product.isActive(), product.getCreatedAt(), product.getCategoryId(), categoryName);
    }

    public static SupplierDto toDto(Supplier supplier) {
        return new SupplierDto(supplier.getId(), supplier.getName(), supplier.getTaxId(), supplier.getContactName(),
                supplier.getEmail(), supplier.getPhone(), supplier.getAddress(), supplier.isActive(), supplier.getCreatedAt());
    }
}
