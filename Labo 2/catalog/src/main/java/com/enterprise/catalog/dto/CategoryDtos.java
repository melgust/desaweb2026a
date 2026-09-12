package com.enterprise.catalog.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public class CategoryDtos {

    public record CategoryResponse(String id, String name, String description, Instant createdAt) {
    }

    public record CategoryRequest(
            @NotBlank(message = "Name is required") String name,
            String description
    ) {
    }
}
