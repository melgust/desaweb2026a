package com.crobless.purchasing;

import java.util.Map;
import org.springframework.dao.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.TransactionException;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<?> status(ResponseStatusException e) { return ResponseEntity.status(e.getStatusCode()).body(Map.of("message", e.getReason() == null ? "Error" : e.getReason())); }
    @ExceptionHandler({IllegalArgumentException.class, MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
    ResponseEntity<?> invalid(Exception e) { return ResponseEntity.badRequest().body(Map.of("message", "Datos inválidos: revisa campos obligatorios, fecha, cantidades y precios.")); }
    @ExceptionHandler(DuplicateKeyException.class)
    ResponseEntity<?> duplicate() { return ResponseEntity.badRequest().body(Map.of("message", "El número de factura ya existe.")); }
    @ExceptionHandler({TransientDataAccessException.class, TransactionException.class})
    ResponseEntity<?> conflict() { return ResponseEntity.status(409).body(Map.of("message", "Otro cambio está en curso. Vuelve a intentar la operación.")); }
    @ExceptionHandler({RestClientException.class, DataAccessException.class})
    ResponseEntity<?> unavailable() { return ResponseEntity.status(503).body(Map.of("message", "Servicio temporalmente no disponible. Intenta nuevamente.")); }
}
