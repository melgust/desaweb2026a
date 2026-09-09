package com.example.catalog.catalog.dto;

import com.example.catalog.catalog.entity.ProductStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Full product representation returned by single-resource endpoints.
 */
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
