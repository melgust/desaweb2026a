package com.enterprise.catalog.dto;

import java.util.List;

public record ProductPagedResponse(
        List<ProductResponse> items,
        int totalItems,
        int page,
        int pageSize,
        int totalPages) {
}