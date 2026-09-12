package com.crobless.purchasing;

import static com.crobless.purchasing.Models.*;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class PurchasingController {
    private final PurchasingService service;
    public PurchasingController(PurchasingService service) { this.service = service; }
    @GetMapping("/suppliers")
    public SupplierPage suppliers(@RequestParam(required=false) String search,
        @RequestParam(required=false) String sortBy, @RequestParam(required=false) String sortDirection,
        @RequestParam(defaultValue="1") int page, @RequestParam(defaultValue="10") int pageSize) {
        return service.suppliers(search, sortBy, sortDirection, page, pageSize);
    }
    @GetMapping("/suppliers/all") public List<Supplier> activeSuppliers() { return service.directory().stream().filter(s -> s.isActive).toList(); }
    @GetMapping("/suppliers/{id}") public Supplier supplier(@PathVariable String id) { return service.supplier(id); }
    @PostMapping("/suppliers") @PreAuthorize("hasAnyRole('Admin','Manager')")
    public ResponseEntity<Supplier> createSupplier(@Valid @RequestBody SupplierRequest request) {
        var result = service.saveSupplier(null, request);
        return ResponseEntity.created(URI.create("/api/suppliers/" + result.id)).body(result);
    }
    @PutMapping("/suppliers/{id}") @PreAuthorize("hasAnyRole('Admin','Manager')")
    public Supplier updateSupplier(@PathVariable String id, @Valid @RequestBody SupplierRequest request) { return service.saveSupplier(id, request); }
    @DeleteMapping("/suppliers/{id}") @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<Void> deleteSupplier(@PathVariable String id) { service.deleteSupplier(id); return ResponseEntity.noContent().build(); }
    @GetMapping("/invoices") public List<Invoice> invoices() { return service.invoices(); }
    @GetMapping("/invoices/settings") public Map<String, Object> settings() { service.checkReady(); return Map.of("taxRate", service.taxRate); }
    @GetMapping("/invoices/{id}") public Invoice invoice(@PathVariable String id) { return service.invoice(id); }
    @PostMapping("/invoices") @PreAuthorize("hasAnyRole('Admin','Manager')")
    public ResponseEntity<Invoice> createInvoice(@Valid @RequestBody InvoiceRequest request) {
        var result = service.saveInvoice(null, request);
        return ResponseEntity.created(URI.create("/api/invoices/" + result.id)).body(result);
    }
    @PutMapping("/invoices/{id}") @PreAuthorize("hasAnyRole('Admin','Manager')")
    public Invoice updateInvoice(@PathVariable String id, @Valid @RequestBody InvoiceRequest request) { return service.saveInvoice(id, request); }
    @DeleteMapping("/invoices/{id}") @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<Void> deleteInvoice(@PathVariable String id) { service.deleteInvoice(id); return ResponseEntity.noContent().build(); }
}
