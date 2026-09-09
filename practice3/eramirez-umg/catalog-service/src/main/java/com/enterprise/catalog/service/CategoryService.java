package com.enterprise.catalog.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.enterprise.catalog.dto.CategoryRequest;
import com.enterprise.catalog.dto.CategoryResponse;
import com.enterprise.catalog.exception.CatalogBadRequestException;
import com.enterprise.catalog.exception.CatalogConflictException;
import com.enterprise.catalog.exception.CatalogNotFoundException;
import com.enterprise.catalog.model.Category;
import com.enterprise.catalog.repository.CategoryRepository;
import com.enterprise.catalog.repository.ProductRepository;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public List<CategoryResponse> getAll() {
        return categoryRepository.findAllByOrderByNameAsc().stream().map(this::toResponse).toList();
    }

    public CategoryResponse getById(String id) {
        return toResponse(findCategory(id));
    }

    public CategoryResponse create(CategoryRequest request) {
        String name = requiredName(request);
        ensureNameIsAvailable(name, null);
        Category category = new Category(name, clean(request.description()));
        return toResponse(categoryRepository.save(category));
    }

    public CategoryResponse update(String id, CategoryRequest request) {
        Category category = findCategory(id);
        String name = requiredName(request);
        ensureNameIsAvailable(name, category.getId());
        category.setName(name);
        category.setDescription(clean(request.description()));
        return toResponse(categoryRepository.save(category));
    }

    public void delete(String id) {
        Category category = findCategory(id);
        var products = productRepository.findAllByCategoryId(id);
        products.forEach(product -> product.setCategoryId(null));
        productRepository.saveAll(products);
        categoryRepository.delete(category);
    }

    private Category findCategory(String id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new CatalogNotFoundException("Category not found."));
    }

    private void ensureNameIsAvailable(String name, String currentId) {
        categoryRepository.findByNameIgnoreCase(name).ifPresent(existing -> {
            if (!existing.getId().equals(currentId)) {
                throw new CatalogConflictException("Category name is already registered.");
            }
        });
    }

    private static String requiredName(CategoryRequest request) {
        if (request == null || request.name() == null || request.name().isBlank()) {
            throw new CatalogBadRequestException("Category name is required.");
        }
        return request.name().trim();
    }

    private static String clean(String value) {
        return value == null ? null : value.trim();
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getDescription(), category.getCreatedAt());
    }
}