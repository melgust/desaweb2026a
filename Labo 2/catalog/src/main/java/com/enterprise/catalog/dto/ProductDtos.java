package com.enterprise.catalog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.Instant;

public class ProductDtos {

    public record ProductResponse(
            String id,
            String name,
            String description,
            BigDecimal price,
            int stock,
            boolean isActive,
            String categoryId,
            String categoryName,
            Instant createdAt
    ) {
    }

    public record ProductRequest(
            @NotBlank(message = "Name is required") String name,
            String description,
            @DecimalMin(value = "0.0", inclusive = true, message = "Price must be >= 0") BigDecimal price,
            @Min(value = 0, message = "Stock must be >= 0") int stock,
            boolean isActive,
            String categoryId
    ) {
    }

    public record PagedResponse<T>(
            java.util.List<T> items,
            long totalItems,
            int page,
            int pageSize,
            int totalPages
    ) {
    }
}
