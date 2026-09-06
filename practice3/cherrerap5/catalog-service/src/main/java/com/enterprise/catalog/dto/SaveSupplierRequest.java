package com.enterprise.catalog.dto;

import jakarta.validation.constraints.NotBlank;

public record SaveSupplierRequest(@NotBlank(message = "Name is required.") String name,
                                  String taxId, String contactName, String email,
                                  String phone, String address, boolean isActive) {
}
