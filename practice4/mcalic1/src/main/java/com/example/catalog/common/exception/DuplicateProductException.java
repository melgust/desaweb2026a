package com.example.catalog.common.exception;

/**
 * Thrown when a product would violate SKU or slug uniqueness. Maps to HTTP 409.
 */
public class DuplicateProductException extends RuntimeException {

    public DuplicateProductException(String message) {
        super(message);
    }

    public static DuplicateProductException forSku(String sku) {
        return new DuplicateProductException("A product with sku '" + sku + "' already exists");
    }

    public static DuplicateProductException forSlug(String slug) {
        return new DuplicateProductException("A product with slug '" + slug + "' already exists");
    }
}
