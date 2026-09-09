package com.enterprise.catalog.dto;

import java.time.Instant;

public record SupplierResponse(
        String id,
        String name,
        String taxId,
        String email,
        String phone,
        String address,
        Boolean isActive,
        Instant createdAt) {
}