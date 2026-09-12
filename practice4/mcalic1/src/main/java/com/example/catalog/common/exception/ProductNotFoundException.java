package com.example.catalog.common.exception;

import java.util.UUID;

/**
 * Thrown when a product cannot be located. Maps to HTTP 404.
 */
public class ProductNotFoundException extends RuntimeException {

    public ProductNotFoundException(UUID id) {
        super("Product not found with id: " + id);
    }

    public ProductNotFoundException(String message) {
        super(message);
    }
}
