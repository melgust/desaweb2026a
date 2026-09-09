package com.enterprise.catalog.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.enterprise.catalog.dto.SupplierRequest;
import com.enterprise.catalog.exception.CatalogBadRequestException;
import com.enterprise.catalog.exception.CatalogConflictException;
import com.enterprise.catalog.model.Supplier;
import com.enterprise.catalog.repository.SupplierRepository;

@ExtendWith(MockitoExtension.class)
class SupplierServiceTest {

    @Mock
    private SupplierRepository supplierRepository;

    private SupplierService service;

    @BeforeEach
    void setUp() {
        service = new SupplierService(supplierRepository);
    }

    @Test
    void createsSupplierWithTrimmedValues() {
        when(supplierRepository.findByTaxId("TAX-1")).thenReturn(Optional.empty());
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(new SupplierRequest(" Supplier ", " TAX-1 ", "mail@example.com", null, null, true));

        assertThat(response.name()).isEqualTo("Supplier");
        assertThat(response.taxId()).isEqualTo("TAX-1");
        verify(supplierRepository).save(any(Supplier.class));
    }

    @Test
    void rejectsDuplicateTaxId() {
        Supplier existing = new Supplier();
        existing.setId("supplier-1");
        when(supplierRepository.findByTaxId("TAX-1")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.create(new SupplierRequest("Supplier", "TAX-1", null, null, null, true)))
                .isInstanceOf(CatalogConflictException.class)
                .hasMessage("Tax ID is already registered.");

        verify(supplierRepository, never()).save(any(Supplier.class));
    }

    @Test
    void rejectsSupplierWithoutRequiredValues() {
        assertThatThrownBy(() -> service.create(new SupplierRequest(" ", "", null, null, null, true)))
                .isInstanceOf(CatalogBadRequestException.class)
                .hasMessage("Supplier name and tax ID are required.");
    }
}