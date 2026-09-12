package com.example.catalog.catalog.service;

import com.example.catalog.catalog.dto.ProductRequest;
import com.example.catalog.catalog.dto.ProductResponse;
import com.example.catalog.catalog.entity.Product;
import com.example.catalog.catalog.entity.ProductStatus;
import com.example.catalog.catalog.mapper.ProductMapper;
import com.example.catalog.catalog.repository.ProductRepository;
import com.example.catalog.common.exception.DuplicateProductException;
import com.example.catalog.common.exception.ProductNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    // Use the real mapper so response mapping is exercised too.
    private final ProductMapper productMapper = new ProductMapper();

    private ProductServiceImpl productService;

    private ProductRequest sampleRequest() {
        return new ProductRequest(
                "SKU-1", "iPhone", "iphone", "A phone",
                new BigDecimal("999.9900"), "USD", ProductStatus.ACTIVE);
    }

    private ProductServiceImpl service() {
        if (productService == null) {
            productService = new ProductServiceImpl(productRepository, productMapper);
        }
        return productService;
    }

    @Test
    void createPersistsProductAndReturnsResponse() {
        ProductRequest request = sampleRequest();
        when(productRepository.existsBySku("SKU-1")).thenReturn(false);
        when(productRepository.existsBySlug("iphone")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        ProductResponse response = service().create(request);

        assertThat(response.sku()).isEqualTo("SKU-1");
        assertThat(response.id()).isNotNull();

        ArgumentCaptor<Product> captor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(captor.capture());
        assertThat(captor.getValue().getId()).isNotNull();
        assertThat(captor.getValue().getStatus()).isEqualTo(ProductStatus.ACTIVE);
    }

    @Test
    void createFailsOnDuplicateSku() {
        when(productRepository.existsBySku("SKU-1")).thenReturn(true);

        assertThatThrownBy(() -> service().create(sampleRequest()))
                .isInstanceOf(DuplicateProductException.class)
                .hasMessageContaining("SKU-1");

        verify(productRepository, never()).save(any());
    }

    @Test
    void createFailsOnDuplicateSlug() {
        when(productRepository.existsBySku("SKU-1")).thenReturn(false);
        when(productRepository.existsBySlug("iphone")).thenReturn(true);

        assertThatThrownBy(() -> service().create(sampleRequest()))
                .isInstanceOf(DuplicateProductException.class)
                .hasMessageContaining("iphone");

        verify(productRepository, never()).save(any());
    }

    @Test
    void getByIdThrowsWhenMissing() {
        UUID id = UUID.randomUUID();
        when(productRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service().getById(id))
                .isInstanceOf(ProductNotFoundException.class);
    }

    @Test
    void updateModifiesExistingProduct() {
        UUID id = UUID.randomUUID();
        Product existing = new Product();
        existing.setId(id);
        existing.setSku("SKU-1");
        existing.setSlug("iphone");
        existing.setName("Old");
        existing.setPrice(new BigDecimal("1.0000"));
        existing.setCurrency("USD");
        existing.setStatus(ProductStatus.DRAFT);

        when(productRepository.findById(id)).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        ProductRequest request = sampleRequest();
        ProductResponse response = service().update(id, request);

        assertThat(response.name()).isEqualTo("iPhone");
        assertThat(response.status()).isEqualTo(ProductStatus.ACTIVE);
    }

    @Test
    void updateThrowsWhenMissing() {
        UUID id = UUID.randomUUID();
        when(productRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service().update(id, sampleRequest()))
                .isInstanceOf(ProductNotFoundException.class);
    }

    @Test
    void deleteRemovesExistingProduct() {
        UUID id = UUID.randomUUID();
        when(productRepository.existsById(id)).thenReturn(true);

        service().delete(id);

        verify(productRepository).deleteById(id);
    }

    @Test
    void deleteThrowsWhenMissing() {
        UUID id = UUID.randomUUID();
        when(productRepository.existsById(id)).thenReturn(false);

        assertThatThrownBy(() -> service().delete(id))
                .isInstanceOf(ProductNotFoundException.class);

        verify(productRepository, never()).deleteById(any());
    }
}
