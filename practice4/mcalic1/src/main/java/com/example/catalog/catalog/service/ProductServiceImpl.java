package com.example.catalog.catalog.service;

import com.example.catalog.catalog.dto.ProductRequest;
import com.example.catalog.catalog.dto.ProductResponse;
import com.example.catalog.catalog.dto.ProductSummaryResponse;
import com.example.catalog.catalog.entity.Product;
import com.example.catalog.catalog.entity.ProductStatus;
import com.example.catalog.catalog.mapper.ProductMapper;
import com.example.catalog.catalog.repository.ProductRepository;
import com.example.catalog.common.exception.DuplicateProductException;
import com.example.catalog.common.exception.ProductNotFoundException;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Default implementation of {@link ProductService}. Holds all business rules:
 * SKU/slug uniqueness, existence checks and transaction boundaries.
 */
@Service
@Transactional(readOnly = true)
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    public ProductServiceImpl(ProductRepository productRepository, ProductMapper productMapper) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
    }

    @Override
    @Transactional
    public ProductResponse create(ProductRequest request) {
        if (productRepository.existsBySku(request.sku())) {
            throw DuplicateProductException.forSku(request.sku());
        }
        if (productRepository.existsBySlug(request.slug())) {
            throw DuplicateProductException.forSlug(request.slug());
        }

        Product product = productMapper.toEntity(request);
        product.setId(UUID.randomUUID());

        Product saved = productRepository.save(product);
        return productMapper.toResponse(saved);
    }

    @Override
    public ProductResponse getById(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        return productMapper.toResponse(product);
    }

    @Override
    public Page<ProductSummaryResponse> findAll(
            ProductStatus status,
            String sku,
            String search,
            Pageable pageable) {

        Specification<Product> spec = buildSpecification(status, sku, search);
        return productRepository.findAll(spec, pageable)
                .map(productMapper::toSummaryResponse);
    }

    @Override
    @Transactional
    public ProductResponse update(UUID id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));

        if (!product.getSku().equals(request.sku()) && productRepository.existsBySku(request.sku())) {
            throw DuplicateProductException.forSku(request.sku());
        }
        if (!product.getSlug().equals(request.slug()) && productRepository.existsBySlug(request.slug())) {
            throw DuplicateProductException.forSlug(request.slug());
        }

        productMapper.applyRequest(product, request);
        Product saved = productRepository.save(product);
        return productMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        if (!productRepository.existsById(id)) {
            throw new ProductNotFoundException(id);
        }
        productRepository.deleteById(id);
    }

    /**
     * Builds a dynamic filter combining the optional status, sku and free-text
     * search parameters. Search matches against name or description
     * (case-insensitive).
     */
    private Specification<Product> buildSpecification(ProductStatus status, String sku, String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (StringUtils.hasText(sku)) {
                predicates.add(cb.equal(root.get("sku"), sku));
            }
            if (StringUtils.hasText(search)) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("description")), like)
                ));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
