package com.enterprise.catalog.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.enterprise.catalog.dto.SupplierRequest;
import com.enterprise.catalog.dto.SupplierResponse;
import com.enterprise.catalog.exception.CatalogBadRequestException;
import com.enterprise.catalog.exception.CatalogConflictException;
import com.enterprise.catalog.exception.CatalogNotFoundException;
import com.enterprise.catalog.model.Supplier;
import com.enterprise.catalog.repository.SupplierRepository;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    public List<SupplierResponse> getAll() {
        return supplierRepository.findAllByOrderByNameAsc().stream().map(this::toResponse).toList();
    }

    public SupplierResponse getById(String id) {
        return toResponse(findSupplier(id));
    }

    public SupplierResponse create(SupplierRequest request) {
        validateRequest(request);
        ensureTaxIdAvailable(request.taxId().trim(), null);
        Supplier supplier = new Supplier();
        apply(supplier, request);
        return toResponse(supplierRepository.save(supplier));
    }

    public SupplierResponse update(String id, SupplierRequest request) {
        validateRequest(request);
        Supplier supplier = findSupplier(id);
        ensureTaxIdAvailable(request.taxId().trim(), supplier.getId());
        apply(supplier, request);
        return toResponse(supplierRepository.save(supplier));
    }

    public void delete(String id) {
        supplierRepository.delete(findSupplier(id));
    }

    private Supplier findSupplier(String id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new CatalogNotFoundException("Supplier not found."));
    }

    private void ensureTaxIdAvailable(String taxId, String currentId) {
        supplierRepository.findByTaxId(taxId).ifPresent(existing -> {
            if (!existing.getId().equals(currentId)) {
                throw new CatalogConflictException("Tax ID is already registered.");
            }
        });
    }

    private static void validateRequest(SupplierRequest request) {
        if (request == null || request.name() == null || request.name().isBlank()
                || request.taxId() == null || request.taxId().isBlank()) {
            throw new CatalogBadRequestException("Supplier name and tax ID are required.");
        }
    }

    private static void apply(Supplier supplier, SupplierRequest request) {
        supplier.setName(request.name().trim());
        supplier.setTaxId(request.taxId().trim());
        supplier.setEmail(clean(request.email()));
        supplier.setPhone(clean(request.phone()));
        supplier.setAddress(clean(request.address()));
        supplier.setIsActive(request.isActive() != null && request.isActive());
        supplier.setUpdatedAt(java.time.Instant.now());
    }

    private static String clean(String value) {
        return value == null ? null : value.trim();
    }

    private SupplierResponse toResponse(Supplier supplier) {
        return new SupplierResponse(supplier.getId(), supplier.getName(), supplier.getTaxId(), supplier.getEmail(), supplier.getPhone(), supplier.getAddress(), supplier.getIsActive(), supplier.getCreatedAt());
    }
}