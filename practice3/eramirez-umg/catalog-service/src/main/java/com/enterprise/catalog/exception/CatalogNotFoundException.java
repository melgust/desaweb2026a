package com.enterprise.catalog.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class CatalogNotFoundException extends RuntimeException {

    public CatalogNotFoundException(String message) {
        super(message);
    }
}