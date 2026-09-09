package com.enterprise.catalog.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ProductRequest(
        @NotBlank String name,
        String description,
        @NotNull BigDecimal price,
        @NotNull Integer stock,
        @NotNull Boolean isActive,
        String categoryId) {
}