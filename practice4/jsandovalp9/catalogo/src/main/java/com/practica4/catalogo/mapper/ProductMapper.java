package com.practica4.catalogo.mapper;

import com.practica4.catalogo.dto.ProductRequest;
import com.practica4.catalogo.dto.ProductResponse;
import com.practica4.catalogo.dto.ProductSummaryResponse;
import com.practica4.catalogo.entity.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public Product toEntity(ProductRequest request) {
        Product product = new Product();
        applyRequest(product, request);
        return product;
    }

    public void applyRequest(Product product, ProductRequest request) {
        product.setSku(request.sku());
        product.setName(request.name());
        product.setSlug(request.slug());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setCurrency(request.currency());
        product.setStatus(request.status());
    }

    public ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getSlug(),
                product.getDescription(),
                product.getPrice(),
                product.getCurrency(),
                product.getStatus(),
                product.getCreatedAt(),
                product.getUpdatedAt(),
                product.getVersion()
        );
    }

    public ProductSummaryResponse toSummaryResponse(Product product) {
        return new ProductSummaryResponse(
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getSlug(),
                product.getPrice(),
                product.getCurrency(),
                product.getStatus()
        );
    }
}
