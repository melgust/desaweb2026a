package com.enterprise.catalog.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.enterprise.catalog.dto.CategoryDto;
import com.enterprise.catalog.mapper.CatalogMapper;
import com.enterprise.catalog.model.Category;
import com.enterprise.catalog.repository.CategoryRepository;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository repository;

    public CategoryServiceImpl(CategoryRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<CategoryDto> getActiveCategories() {
        return repository.findByActiveTrueOrderByNameAsc().stream().map(CatalogMapper::toDto).toList();
    }

    @Override
    public Category requireActive(String id) {
        return repository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found or inactive."));
    }
}
