package com.enterprise.catalog.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.NoSuchElementException;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.enterprise.catalog.dto.ProductDto;
import com.enterprise.catalog.dto.SaveProductRequest;
import com.enterprise.catalog.model.Category;
import com.enterprise.catalog.model.Product;
import com.enterprise.catalog.repository.CategoryRepository;
import com.enterprise.catalog.repository.ProductRepository;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private CategoryService categoryService;

    private ProductServiceImpl service;
    private Category category;

    @BeforeEach
    void setUp() {
        service = new ProductServiceImpl(productRepository, categoryRepository, categoryService);
        category = new Category("category-1", "Laptop", "Productos de tipo Laptop", true, Instant.now());
    }

    @Test
    void createsProductInActiveCategory() {
        SaveProductRequest request = request("Laptop Nova", "999.90", 8, "category-1");
        when(categoryService.requireActive("category-1")).thenReturn(category);
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product saved = invocation.getArgument(0);
            saved.setId("product-1");
            return saved;
        });

        ProductDto result = service.create(request);

        assertEquals("product-1", result.id());
        assertEquals("Laptop", result.categoryName());
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void getsProductWithItsCategoryName() {
        Product product = product("product-1", "Original", "category-1");
        when(productRepository.findById("product-1")).thenReturn(Optional.of(product));
        when(categoryRepository.findById("category-1")).thenReturn(Optional.of(category));

        ProductDto result = service.getById("product-1");

        assertEquals("Original", result.name());
        assertEquals("Laptop", result.categoryName());
    }

    @Test
    void updatesExistingProduct() {
        Product product = product("product-1", "Original", "category-1");
        SaveProductRequest request = request("Actualizado", "1250.50", 20, "category-1");
        when(productRepository.findById("product-1")).thenReturn(Optional.of(product));
        when(categoryService.requireActive("category-1")).thenReturn(category);
        when(productRepository.save(product)).thenReturn(product);

        ProductDto result = service.update("product-1", request);

        assertEquals("Actualizado", result.name());
        assertEquals(new BigDecimal("1250.50"), result.price());
        assertEquals(20, result.stock());
        assertTrue(result.isActive());
        verify(productRepository).save(product);
    }

    @Test
    void deletesExistingProduct() {
        Product product = product("product-1", "Original", "category-1");
        when(productRepository.findById("product-1")).thenReturn(Optional.of(product));

        service.delete("product-1");

        verify(productRepository).delete(product);
    }

    @Test
    void reportsMissingProduct() {
        when(productRepository.findById("missing")).thenReturn(Optional.empty());

        NoSuchElementException exception = assertThrows(
                NoSuchElementException.class,
                () -> service.getById("missing"));

        assertEquals("Product not found.", exception.getMessage());
    }

    private static SaveProductRequest request(String name, String price, int stock, String categoryId) {
        return new SaveProductRequest(name, "Description", new BigDecimal(price), stock, true, categoryId);
    }

    private static Product product(String id, String name, String categoryId) {
        Instant now = Instant.now();
        return new Product(id, name, "Description", new BigDecimal("500.00"), 5,
                categoryId, true, now, now);
    }
}
