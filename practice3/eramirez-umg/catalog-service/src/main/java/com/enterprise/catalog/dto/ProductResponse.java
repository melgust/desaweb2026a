package com.enterprise.catalog.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record ProductResponse(
        String id,
        String name,
        String description,
        BigDecimal price,
        Integer stock,
        Boolean isActive,
        Instant createdAt,
        String categoryName) {
}