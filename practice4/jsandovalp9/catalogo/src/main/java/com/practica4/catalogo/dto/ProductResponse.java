package com.practica4.catalogo.dto;

import com.practica4.catalogo.entity.ProductStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String sku,
        String name,
        String slug,
        String description,
        BigDecimal price,
        String currency,
        ProductStatus status,
        Instant createdAt,
        Instant updatedAt,
        Long version
) {
}
