package com.example.catalog.catalog.dto;

import com.example.catalog.catalog.entity.ProductStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Request payload for creating or updating a product.
 */
public record ProductRequest(

        @NotBlank
        @Size(max = 50)
        String sku,

        @NotBlank
        @Size(max = 200)
        String name,

        @NotBlank
        @Size(max = 200)
        String slug,

        @Size(max = 5000)
        String description,

        @NotNull
        @PositiveOrZero
        BigDecimal price,

        @NotBlank
        @Size(min = 3, max = 3)
        String currency,

        @NotNull
        ProductStatus status
) {
}
