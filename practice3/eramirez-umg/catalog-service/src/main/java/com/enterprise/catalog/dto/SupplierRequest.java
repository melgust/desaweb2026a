package com.enterprise.catalog.dto;

import jakarta.validation.constraints.NotBlank;

public record SupplierRequest(
        @NotBlank String name,
        @NotBlank String taxId,
        String email,
        String phone,
        String address,
        Boolean isActive) {
}