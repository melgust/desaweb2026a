package com.practica4.catalogo.dto;

import com.practica4.catalogo.entity.ProductStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductSummaryResponse(
        UUID id,
        String sku,
        String name,
        String slug,
        BigDecimal price,
        String currency,
        ProductStatus status
) {
}
