package com.practica4.catalogo.service;

import com.practica4.catalogo.dto.ProductRequest;
import com.practica4.catalogo.dto.ProductResponse;
import com.practica4.catalogo.dto.ProductSummaryResponse;
import com.practica4.catalogo.entity.Product;
import com.practica4.catalogo.entity.ProductStatus;
import com.practica4.catalogo.exception.DuplicateProductException;
import com.practica4.catalogo.exception.ProductNotFoundException;
import com.practica4.catalogo.mapper.ProductMapper;
import com.practica4.catalogo.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.UUID;

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
        Instant now = Instant.now();
        product.setCreatedAt(now);
        product.setUpdatedAt(now);

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
    public Page<ProductSummaryResponse> findAll(ProductStatus status, String sku, String search, Pageable pageable) {
        return productRepository.findAll(status, normalize(sku), normalize(search), pageable)
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
        product.setUpdatedAt(Instant.now());

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

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
