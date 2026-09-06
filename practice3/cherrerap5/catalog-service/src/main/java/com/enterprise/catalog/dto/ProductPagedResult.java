package com.enterprise.catalog.dto;

import java.util.List;

public record ProductPagedResult(List<ProductDto> items, long totalItems, int page, int pageSize, int totalPages) {
}
