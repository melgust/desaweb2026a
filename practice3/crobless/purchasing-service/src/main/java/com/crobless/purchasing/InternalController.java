package com.crobless.purchasing;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal")
public class InternalController {
    private final PurchasingService service;
    public InternalController(PurchasingService service) { this.service = service; }
    @GetMapping("/suppliers") public List<Models.Supplier> suppliers() { return service.directory(); }
    @PutMapping("/products/{id}/deletion")
    public ResponseEntity<Void> reserveDeletion(@PathVariable String id) {
        service.reserveProductDeletion(id); return ResponseEntity.noContent().build();
    }
}
