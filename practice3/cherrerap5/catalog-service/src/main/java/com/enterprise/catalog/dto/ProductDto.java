package com.enterprise.catalog.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record ProductDto(String id, String name, String description, BigDecimal price, int stock,
                         boolean isActive, Instant createdAt, String categoryId, String categoryName) {
}
