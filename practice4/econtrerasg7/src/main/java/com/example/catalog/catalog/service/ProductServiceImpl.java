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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

/**
 * Default implementation of ProductService.
 */
@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    public ProductServiceImpl(ProductRepository productRepository, ProductMapper productMapper) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
    }

    @Override
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

        List<Product> productos = productRepository.findAll();

        List<ProductSummaryResponse> productosFiltrados = productos.stream()
                .filter(producto ->
                        status == null || producto.getStatus() == status
                )
                .filter(producto ->
                        !StringUtils.hasText(sku)
                                || producto.getSku().equalsIgnoreCase(sku)
                )
                .filter(producto -> {

                    if (!StringUtils.hasText(search)) {
                        return true;
                    }

                    String busqueda = search.toLowerCase();

                    boolean coincideNombre =
                            producto.getName() != null
                                    && producto.getName().toLowerCase().contains(busqueda);

                    boolean coincideDescripcion =
                            producto.getDescription() != null
                                    && producto.getDescription().toLowerCase().contains(busqueda);

                    return coincideNombre || coincideDescripcion;
                })
                .map(productMapper::toSummaryResponse)
                .toList();

        int inicio = (int) pageable.getOffset();

        if (inicio >= productosFiltrados.size()) {
            return new PageImpl<>(List.of(), pageable, productosFiltrados.size());
        }

        int fin = Math.min(
                inicio + pageable.getPageSize(),
                productosFiltrados.size()
        );

        List<ProductSummaryResponse> pagina =
                productosFiltrados.subList(inicio, fin);

        return new PageImpl<>(
                pagina,
                pageable,
                productosFiltrados.size()
        );
    }

    @Override
    public ProductResponse update(UUID id, ProductRequest request) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));

        if (!product.getSku().equals(request.sku())
                && productRepository.existsBySku(request.sku())) {

            throw DuplicateProductException.forSku(request.sku());
        }

        if (!product.getSlug().equals(request.slug())
                && productRepository.existsBySlug(request.slug())) {

            throw DuplicateProductException.forSlug(request.slug());
        }

        productMapper.applyRequest(product, request);

        Product saved = productRepository.save(product);

        return productMapper.toResponse(saved);
    }

    @Override
    public void delete(UUID id) {

        if (!productRepository.existsById(id)) {
            throw new ProductNotFoundException(id);
        }

        productRepository.deleteById(id);
    }
}