package com.practica4.catalogo.service;

import com.practica4.catalogo.dto.ProductRequest;
import com.practica4.catalogo.dto.ProductResponse;
import com.practica4.catalogo.entity.Product;
import com.practica4.catalogo.entity.ProductStatus;
import com.practica4.catalogo.exception.DuplicateProductException;
import com.practica4.catalogo.exception.ProductNotFoundException;
import com.practica4.catalogo.mapper.ProductMapper;
import com.practica4.catalogo.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProductServiceTest {

    private ProductRepository productRepository;
    private ProductMapper productMapper;
    private ProductServiceImpl productService;

    @BeforeEach
    void setUp() {
        productRepository = mock(ProductRepository.class);
        productMapper = new ProductMapper();
        productService = new ProductServiceImpl(productRepository, productMapper);
    }

    @Test
    void create_whenDataIsValid_shouldSaveProduct() {
        ProductRequest request = new ProductRequest(
                "SKU-1",
                "iPhone 16",
                "iphone-16",
                "Smartphone",
                new BigDecimal("999.99"),
                "USD",
                ProductStatus.ACTIVE
        );

        when(productRepository.existsBySku("SKU-1")).thenReturn(false);
        when(productRepository.existsBySlug("iphone-16")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product product = invocation.getArgument(0);
            product.setId(UUID.randomUUID());
            product.setCreatedAt(Instant.now());
            product.setUpdatedAt(Instant.now());
            product.setVersion(1L);
            return product;
        });

        ProductResponse response = productService.create(request);

        assertThat(response.sku()).isEqualTo("SKU-1");
        assertThat(response.slug()).isEqualTo("iphone-16");
        assertThat(response.name()).isEqualTo("iPhone 16");

        ArgumentCaptor<Product> captor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(captor.capture());
        assertThat(captor.getValue().getId()).isNotNull();
        assertThat(captor.getValue().getStatus()).isEqualTo(ProductStatus.ACTIVE);
    }

    @Test
    void create_whenSkuAlreadyExists_shouldThrowDuplicateProductException() {
        ProductRequest request = new ProductRequest(
                "SKU-1",
                "iPhone 16",
                "iphone-16",
                "Smartphone",
                new BigDecimal("999.99"),
                "USD",
                ProductStatus.ACTIVE
        );

        when(productRepository.existsBySku("SKU-1")).thenReturn(true);

        assertThatThrownBy(() -> productService.create(request))
                .isInstanceOf(DuplicateProductException.class)
                .hasMessageContaining("SKU-1");

        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void update_whenProductExistsAndNoConflicts_shouldPersistChanges() {
        UUID id = UUID.randomUUID();
        Product existing = new Product();
        existing.setId(id);
        existing.setSku("SKU-1");
        existing.setSlug("iphone-16");
        existing.setName("iPhone 16");
        existing.setDescription("Old");
        existing.setPrice(new BigDecimal("899.00"));
        existing.setCurrency("USD");
        existing.setStatus(ProductStatus.ACTIVE);

        ProductRequest request = new ProductRequest(
                "SKU-2",
                "iPhone 17",
                "iphone-17",
                "New version",
                new BigDecimal("1099.00"),
                "USD",
                ProductStatus.ACTIVE
        );

        when(productRepository.findById(id)).thenReturn(Optional.of(existing));
        when(productRepository.existsBySku("SKU-2")).thenReturn(false);
        when(productRepository.existsBySlug("iphone-17")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProductResponse response = productService.update(id, request);

        assertThat(response.sku()).isEqualTo("SKU-2");
        assertThat(response.slug()).isEqualTo("iphone-17");
        assertThat(response.name()).isEqualTo("iPhone 17");
    }

    @Test
    void delete_whenProductExists_shouldRemoveIt() {
        UUID id = UUID.randomUUID();
        when(productRepository.existsById(id)).thenReturn(true);

        productService.delete(id);

        verify(productRepository).deleteById(id);
    }

    @Test
    void findAll_shouldDelegateToRepositoryAndMapSummary() {
        UUID id = UUID.randomUUID();
        Product product = new Product();
        product.setId(id);
        product.setSku("SKU-1");
        product.setName("Laptop");
        product.setSlug("laptop");
        product.setPrice(new BigDecimal("1500.00"));
        product.setCurrency("USD");
        product.setStatus(ProductStatus.ACTIVE);
        product.setCreatedAt(Instant.now());
        product.setUpdatedAt(Instant.now());
        product.setVersion(1L);

        Pageable pageable = PageRequest.of(0, 10);
        when(productRepository.findAll(ProductStatus.ACTIVE, "SKU-1", "lap", pageable))
                .thenReturn(new PageImpl<>(List.of(product), pageable, 1));

        Page<?> page = productService.findAll(ProductStatus.ACTIVE, "SKU-1", "lap", pageable);

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent()).hasSize(1);
    }

    @Test
    void getById_whenProductDoesNotExist_shouldThrowNotFound() {
        UUID id = UUID.randomUUID();
        when(productRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getById(id))
                .isInstanceOf(ProductNotFoundException.class)
                .hasMessageContaining(id.toString());
    }
}
