package com.enterprise.catalog.service;

import com.enterprise.catalog.dto.CategoryDtos.CategoryRequest;
import com.enterprise.catalog.dto.CategoryDtos.CategoryResponse;
import com.enterprise.catalog.exception.ConflictException;
import com.enterprise.catalog.exception.NotFoundException;
import com.enterprise.catalog.model.Category;
import com.enterprise.catalog.repository.CategoryRepository;
import com.enterprise.catalog.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public List<CategoryResponse> getAll() {
        return categoryRepository.findAll().stream()
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .map(this::toResponse)
                .toList();
    }

    public CategoryResponse getById(String id) {
        return toResponse(findOrThrow(id));
    }

    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.name())) {
            throw new ConflictException("A category with that name already exists.");
        }
        Category category = new Category(request.name(), request.description());
        return toResponse(categoryRepository.save(category));
    }

    public CategoryResponse update(String id, CategoryRequest request) {
        Category category = findOrThrow(id);

        categoryRepository.findByNameIgnoreCase(request.name()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new ConflictException("A category with that name already exists.");
            }
        });

        category.setName(request.name());
        category.setDescription(request.description());
        return toResponse(categoryRepository.save(category));
    }

    public void delete(String id) {
        Category category = findOrThrow(id);
        long productsUsingIt = productRepository.countByCategory_Id(id);
        if (productsUsingIt > 0) {
            throw new ConflictException("Cannot delete a category that still has products assigned to it.");
        }
        categoryRepository.delete(category);
    }

    private Category findOrThrow(String id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found."));
    }

    private CategoryResponse toResponse(Category c) {
        return new CategoryResponse(c.getId(), c.getName(), c.getDescription(), c.getCreatedAt());
    }
}
