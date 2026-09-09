package com.enterprise.catalog.dto;

import java.time.Instant;

public record CategoryResponse(
        String id,
        String name,
        String description,
        Instant createdAt) {
}