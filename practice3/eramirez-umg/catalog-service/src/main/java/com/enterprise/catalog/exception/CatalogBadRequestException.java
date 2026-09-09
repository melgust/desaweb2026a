package com.enterprise.catalog.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class CatalogBadRequestException extends RuntimeException {

    public CatalogBadRequestException(String message) {
        super(message);
    }
}