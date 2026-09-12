package com.enterprise.catalog.service;

import com.enterprise.catalog.dto.ProductDtos.PagedResponse;
import com.enterprise.catalog.dto.ProductDtos.ProductRequest;
import com.enterprise.catalog.dto.ProductDtos.ProductResponse;
import com.enterprise.catalog.exception.NotFoundException;
import com.enterprise.catalog.model.Category;
import com.enterprise.catalog.model.CategoryRef;
import com.enterprise.catalog.model.Product;
import com.enterprise.catalog.repository.CategoryRepository;
import com.enterprise.catalog.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public PagedResponse<ProductResponse> getAll(String search, String sortBy, String sortDirection, int page, int pageSize) {
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String sortField = switch (sortBy == null ? "name" : sortBy.toLowerCase()) {
            case "price" -> "price";
            case "stock" -> "stock";
            case "createdat" -> "createdAt";
            default -> "name";
        };

        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), Math.max(pageSize, 1), Sort.by(direction, sortField));

        Page<Product> result = (search == null || search.isBlank())
                ? productRepository.findAll(pageable)
                : productRepository.findByNameContainingIgnoreCase(search, pageable);

        var items = result.getContent().stream().map(this::toResponse).toList();

        return new PagedResponse<>(items, result.getTotalElements(), page, pageSize, result.getTotalPages());
    }

    public ProductResponse getById(String id) {
        return toResponse(findOrThrow(id));
    }

    public ProductResponse create(ProductRequest request) {
        Product product = new Product();
        applyRequest(product, request);
        return toResponse(productRepository.save(product));
    }

    public ProductResponse update(String id, ProductRequest request) {
        Product product = findOrThrow(id);
        applyRequest(product, request);
        return toResponse(productRepository.save(product));
    }

    public void delete(String id) {
        Product product = findOrThrow(id);
        productRepository.delete(product);
    }

    private void applyRequest(Product product, ProductRequest request) {
        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setStock(request.stock());
        product.setActive(request.isActive());

        if (request.categoryId() == null || request.categoryId().isBlank()) {
            product.setCategory(null);
        } else {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new NotFoundException("Category not found."));
            product.setCategory(new CategoryRef(category.getId(), category.getName()));
        }
    }

    private Product findOrThrow(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found."));
    }

    private ProductResponse toResponse(Product p) {
        String categoryId = p.getCategory() != null ? p.getCategory().getId() : null;
        String categoryName = p.getCategory() != null ? p.getCategory().getName() : null;
        return new ProductResponse(p.getId(), p.getName(), p.getDescription(), p.getPrice(), p.getStock(),
                p.isActive(), categoryId, categoryName, p.getCreatedAt());
    }
}
