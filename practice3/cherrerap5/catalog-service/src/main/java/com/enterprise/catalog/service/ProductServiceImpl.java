package com.enterprise.catalog.service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import com.enterprise.catalog.dto.ProductDto;
import com.enterprise.catalog.dto.ProductPagedResult;
import com.enterprise.catalog.dto.SaveProductRequest;
import com.enterprise.catalog.mapper.CatalogMapper;
import com.enterprise.catalog.model.Category;
import com.enterprise.catalog.model.Product;
import com.enterprise.catalog.repository.CategoryRepository;
import com.enterprise.catalog.repository.ProductRepository;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;

    public ProductServiceImpl(ProductRepository productRepository, CategoryRepository categoryRepository,
                              CategoryService categoryService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.categoryService = categoryService;
    }

    @Override
    public ProductPagedResult getProducts(String search, String categoryId, String sortBy, String sortDirection,
                                          int page, int pageSize) {
        int safePage = Math.max(page, 1);
        int safePageSize = Math.max(1, Math.min(pageSize, 100));
        List<String> categoryMatches = search == null || search.isBlank()
                ? List.of()
                : categoryRepository.findByNameContainingIgnoreCase(search.trim()).stream().map(Category::getId).toList();
        Page<Product> result = productRepository.search(search, categoryId, categoryMatches,
                sortBy, sortDirection, safePage, safePageSize);

        Map<String, Category> categories = categoryRepository.findAllById(
                        result.getContent().stream().map(Product::getCategoryId).filter(id -> id != null).distinct().toList())
                .stream().collect(Collectors.toMap(Category::getId, Function.identity()));
        List<ProductDto> items = result.getContent().stream()
                .map(product -> CatalogMapper.toDto(product,
                        categories.containsKey(product.getCategoryId()) ? categories.get(product.getCategoryId()).getName() : null))
                .toList();
        return new ProductPagedResult(items, result.getTotalElements(), safePage, safePageSize, result.getTotalPages());
    }

    @Override
    public ProductDto getById(String id) {
        Product product = requireProduct(id);
        Category category = product.getCategoryId() == null ? null
                : categoryRepository.findById(product.getCategoryId()).orElse(null);
        return CatalogMapper.toDto(product, category == null ? null : category.getName());
    }

    @Override
    public ProductDto create(SaveProductRequest request) {
        Category category = categoryService.requireActive(request.categoryId());
        Instant now = Instant.now();
        Product product = new Product(null, request.name(), request.description(), request.price(), request.stock(),
                category.getId(), request.isActive(), now, now);
        return CatalogMapper.toDto(productRepository.save(product), category.getName());
    }

    @Override
    public ProductDto update(String id, SaveProductRequest request) {
        Product product = requireProduct(id);
        Category category = categoryService.requireActive(request.categoryId());
        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setStock(request.stock());
        product.setActive(request.isActive());
        product.setCategoryId(category.getId());
        product.setUpdatedAt(Instant.now());
        return CatalogMapper.toDto(productRepository.save(product), category.getName());
    }

    @Override
    public void delete(String id) {
        productRepository.delete(requireProduct(id));
    }

    private Product requireProduct(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Product not found."));
    }
}
