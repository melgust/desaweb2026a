package com.example.catalog.catalog.dto;

import com.example.catalog.catalog.entity.ProductStatus;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Compact product representation used in paginated list responses.
 */
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
