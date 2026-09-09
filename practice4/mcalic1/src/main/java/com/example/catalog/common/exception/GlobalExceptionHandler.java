package com.example.catalog.common.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Centralised exception handling. Returns RFC 9457 Problem Details and never
 * exposes stack traces to API clients.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ProductNotFoundException.class)
    public ProblemDetail handleNotFound(ProductNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Product Not Found");
        problem.setType(URI.create("urn:catalog:error:product-not-found"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(DuplicateProductException.class)
    public ProblemDetail handleDuplicate(DuplicateProductException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setTitle("Duplicate Product");
        problem.setType(URI.create("urn:catalog:error:duplicate-product"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, "One or more fields are invalid");
        problem.setTitle("Validation Failed");
        problem.setType(URI.create("urn:catalog:error:validation"));
        problem.setProperty("timestamp", Instant.now());

        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> {
                    Map<String, String> error = new LinkedHashMap<>();
                    error.put("field", fieldError.getField());
                    error.put("message", fieldError.getDefaultMessage());
                    return error;
                })
                .toList();
        problem.setProperty("errors", errors);
        return problem;
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ProblemDetail handleConstraintViolation(ConstraintViolationException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, "One or more parameters are invalid");
        problem.setTitle("Validation Failed");
        problem.setType(URI.create("urn:catalog:error:validation"));
        problem.setProperty("timestamp", Instant.now());

        List<Map<String, String>> errors = ex.getConstraintViolations().stream()
                .map(violation -> {
                    Map<String, String> error = new LinkedHashMap<>();
                    error.put("field", violation.getPropertyPath().toString());
                    error.put("message", violation.getMessage());
                    return error;
                })
                .toList();
        problem.setProperty("errors", errors);
        return problem;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrity(DataIntegrityViolationException ex) {
        // Typically a race on the unique SKU/slug constraints enforced by the DB.
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT, "The request conflicts with an existing resource");
        problem.setTitle("Data Integrity Violation");
        problem.setType(URI.create("urn:catalog:error:data-integrity"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }
}
