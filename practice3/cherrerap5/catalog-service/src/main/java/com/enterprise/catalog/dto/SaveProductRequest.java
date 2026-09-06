package com.enterprise.catalog.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SaveProductRequest(
        @NotNull(message = "Name is required.") String name,
        String description,
        @NotNull(message = "Price is required.") BigDecimal price,
        int stock,
        boolean isActive,
        @NotBlank(message = "Category is required.") String categoryId) {
}
