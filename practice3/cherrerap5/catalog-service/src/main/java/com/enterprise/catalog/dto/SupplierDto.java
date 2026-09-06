package com.enterprise.catalog.dto;

import java.time.Instant;

public record SupplierDto(String id, String name, String taxId, String contactName, String email,
                          String phone, String address, boolean isActive, Instant createdAt) {
}
