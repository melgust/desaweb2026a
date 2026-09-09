package com.enterprise.catalog.service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.enterprise.catalog.dto.ProductPagedResponse;
import com.enterprise.catalog.dto.ProductRequest;
import com.enterprise.catalog.dto.ProductResponse;
import com.enterprise.catalog.exception.CatalogBadRequestException;
import com.enterprise.catalog.exception.CatalogNotFoundException;
import com.enterprise.catalog.model.Category;
import com.enterprise.catalog.model.Product;
import com.enterprise.catalog.repository.CategoryRepository;
import com.enterprise.catalog.repository.ProductRepository;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public ProductPagedResponse getProducts(String search, String sortBy, String sortDirection, int page, int pageSize) {
        int safePage = Math.max(1, page);
        int safePageSize = Math.max(1, Math.min(pageSize, 100));
        Map<String, String> categoryNames = categoryNames();
        String normalizedSearch = search == null ? "" : search.trim().toLowerCase();

        List<Product> filtered = productRepository.findAll().stream()
                .filter(product -> matchesSearch(product, normalizedSearch, categoryNames))
                .sorted(comparator(sortBy, sortDirection, categoryNames))
                .toList();

        int totalItems = filtered.size();
        int totalPages = (int) Math.ceil(totalItems / (double) safePageSize);
        int from = Math.min((safePage - 1) * safePageSize, totalItems);
        int to = Math.min(from + safePageSize, totalItems);
        List<ProductResponse> items = filtered.subList(from, to).stream()
                .map(product -> toResponse(product, categoryNames))
                .toList();

        return new ProductPagedResponse(items, totalItems, safePage, safePageSize, totalPages);
    }

    public ProductResponse getById(String id) {
        return toResponse(findProduct(id), categoryNames());
    }

    public ProductResponse create(ProductRequest request) {
        validateRequest(request);
        String categoryId = normalizeCategoryId(request.categoryId());
        ensureCategoryExists(categoryId);
        Product product = new Product();
        apply(product, request, categoryId);
        return toResponse(productRepository.save(product), categoryNames());
    }

    public ProductResponse update(String id, ProductRequest request) {
        validateRequest(request);
        Product product = findProduct(id);
        String categoryId = normalizeCategoryId(request.categoryId());
        ensureCategoryExists(categoryId);
        apply(product, request, categoryId);
        return toResponse(productRepository.save(product), categoryNames());
    }

    public void delete(String id) {
        productRepository.delete(findProduct(id));
    }

    private Product findProduct(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new CatalogNotFoundException("Product not found."));
    }

    private void ensureCategoryExists(String categoryId) {
        if (categoryId != null && !categoryRepository.existsById(categoryId)) {
            throw new CatalogNotFoundException("Category not found.");
        }
    }

    private static void validateRequest(ProductRequest request) {
        if (request == null || request.name() == null || request.name().isBlank()) {
            throw new CatalogBadRequestException("Product name is required.");
        }
        if (request.price() == null || request.stock() == null || request.isActive() == null) {
            throw new CatalogBadRequestException("Product price, stock and active status are required.");
        }
    }

    private static void apply(Product product, ProductRequest request, String categoryId) {
        product.setName(request.name().trim());
        product.setDescription(clean(request.description()));
        product.setPrice(request.price());
        product.setStock(request.stock());
        product.setIsActive(request.isActive());
        product.setCategoryId(categoryId);
        product.setUpdatedAt(java.time.Instant.now());
    }

    private Map<String, String> categoryNames() {
        return categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getId, Category::getName));
    }

    private static boolean matchesSearch(Product product, String search, Map<String, String> categoryNames) {
        return search.isEmpty()
                || contains(product.getName(), search)
                || contains(product.getDescription(), search)
                || contains(categoryNames.get(product.getCategoryId()), search);
    }

    private static Comparator<Product> comparator(String sortBy, String sortDirection, Map<String, String> categoryNames) {
        Comparator<Product> comparator = switch (sortBy == null ? "name" : sortBy.toLowerCase()) {
            case "price" -> Comparator.comparing(Product::getPrice, Comparator.nullsFirst(Comparator.naturalOrder()));
            case "stock" -> Comparator.comparing(Product::getStock, Comparator.nullsFirst(Comparator.naturalOrder()));
            case "category" -> Comparator.comparing(product -> categoryNames.getOrDefault(product.getCategoryId(), ""));
            case "createdat" -> Comparator.comparing(Product::getCreatedAt, Comparator.nullsFirst(Comparator.naturalOrder()));
            default -> Comparator.comparing(Product::getName, Comparator.nullsFirst(Comparator.naturalOrder()));
        };
        return "desc".equalsIgnoreCase(sortDirection) ? comparator.reversed() : comparator;
    }

    private static boolean contains(String value, String search) {
        return value != null && value.toLowerCase().contains(search);
    }

    private static String normalizeCategoryId(String categoryId) {
        return categoryId == null || categoryId.isBlank() ? null : categoryId;
    }

    private static String clean(String value) {
        return value == null ? null : value.trim();
    }

    private static ProductResponse toResponse(Product product, Map<String, String> categoryNames) {
        return new ProductResponse(product.getId(), product.getName(), product.getDescription(), product.getPrice(), product.getStock(), product.getIsActive(), product.getCreatedAt(), categoryNames.get(product.getCategoryId()));
    }
}