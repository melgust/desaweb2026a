package com.enterprise.catalog.service;

import java.util.List;

import com.enterprise.catalog.dto.SaveSupplierRequest;
import com.enterprise.catalog.dto.SupplierDto;

public interface SupplierService {
    List<SupplierDto> getAll();
    SupplierDto getById(String id);
    SupplierDto create(SaveSupplierRequest request);
    SupplierDto update(String id, SaveSupplierRequest request);
    void delete(String id);
}
