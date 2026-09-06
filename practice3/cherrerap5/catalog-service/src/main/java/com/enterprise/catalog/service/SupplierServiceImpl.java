package com.enterprise.catalog.service;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import com.enterprise.catalog.dto.SaveSupplierRequest;
import com.enterprise.catalog.dto.SupplierDto;
import com.enterprise.catalog.mapper.CatalogMapper;
import com.enterprise.catalog.model.Supplier;
import com.enterprise.catalog.repository.SupplierRepository;

@Service
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository repository;

    public SupplierServiceImpl(SupplierRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<SupplierDto> getAll() {
        return repository.findAllByOrderByNameAsc().stream().map(CatalogMapper::toDto).toList();
    }

    @Override
    public SupplierDto getById(String id) {
        return CatalogMapper.toDto(requireSupplier(id));
    }

    @Override
    public SupplierDto create(SaveSupplierRequest request) {
        validateName(request.name());
        assertTaxIdAvailable(clean(request.taxId()), null);
        Instant now = Instant.now();
        Supplier supplier = new Supplier(null, request.name().trim(), clean(request.taxId()), clean(request.contactName()),
                clean(request.email()), clean(request.phone()), clean(request.address()), request.isActive(), now, now);
        return CatalogMapper.toDto(repository.save(supplier));
    }

    @Override
    public SupplierDto update(String id, SaveSupplierRequest request) {
        validateName(request.name());
        Supplier supplier = requireSupplier(id);
        String taxId = clean(request.taxId());
        assertTaxIdAvailable(taxId, id);
        supplier.setName(request.name().trim());
        supplier.setTaxId(taxId);
        supplier.setContactName(clean(request.contactName()));
        supplier.setEmail(clean(request.email()));
        supplier.setPhone(clean(request.phone()));
        supplier.setAddress(clean(request.address()));
        supplier.setActive(request.isActive());
        supplier.setUpdatedAt(Instant.now());
        return CatalogMapper.toDto(repository.save(supplier));
    }

    @Override
    public void delete(String id) {
        repository.delete(requireSupplier(id));
    }

    private Supplier requireSupplier(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Supplier not found."));
    }

    private void assertTaxIdAvailable(String taxId, String currentId) {
        if (taxId == null) return;
        repository.findByTaxId(taxId).filter(existing -> !existing.getId().equals(currentId)).ifPresent(existing -> {
            throw new DuplicateKeyException("Supplier tax ID already exists.");
        });
    }

    private static void validateName(String name) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("Name is required.");
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
