package com.enterprise.catalog.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.enterprise.catalog.dto.ProductRequest;
import com.enterprise.catalog.exception.CatalogBadRequestException;
import com.enterprise.catalog.exception.CatalogNotFoundException;
import com.enterprise.catalog.model.Category;
import com.enterprise.catalog.model.Product;
import com.enterprise.catalog.repository.CategoryRepository;
import com.enterprise.catalog.repository.ProductRepository;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    private ProductService service;

    @BeforeEach
    void setUp() {
        service = new ProductService(productRepository, categoryRepository);
    }

    @Test
    void createsProductWhenCategoryExists() {
        Category category = new Category("Office", null);
        category.setId("category-1");
        when(categoryRepository.existsById("category-1")).thenReturn(true);
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(categoryRepository.findAll()).thenReturn(List.of(category));

        var response = service.create(new ProductRequest(" Printer ", "Laser", BigDecimal.TEN, 4, true, "category-1"));

        assertThat(response.name()).isEqualTo("Printer");
        assertThat(response.categoryName()).isEqualTo("Office");
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void rejectsProductWithMissingCategory() {
        when(categoryRepository.existsById("missing")).thenReturn(false);

        assertThatThrownBy(() -> service.create(new ProductRequest("Printer", null, BigDecimal.TEN, 4, true, "missing")))
                .isInstanceOf(CatalogNotFoundException.class)
                .hasMessage("Category not found.");

        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void returnsFilteredPagedProducts() {
        Category category = new Category("Office", null);
        category.setId("category-1");
        Product first = product("A Printer", "category-1", 10);
        Product second = product("B Printer", "category-1", 20);
        when(categoryRepository.findAll()).thenReturn(List.of(category));
        when(productRepository.findAll()).thenReturn(List.of(second, first));

        var response = service.getProducts("printer", "price", "asc", 1, 1);

        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).name()).isEqualTo("A Printer");
        assertThat(response.totalItems()).isEqualTo(2);
        assertThat(response.totalPages()).isEqualTo(2);
    }

    @Test
    void rejectsProductWithoutRequiredValues() {
        assertThatThrownBy(() -> service.create(new ProductRequest(" ", null, null, null, null, null)))
                .isInstanceOf(CatalogBadRequestException.class)
                .hasMessage("Product name is required.");
    }

    private static Product product(String name, String categoryId, int price) {
        Product product = new Product();
        product.setName(name);
        product.setCategoryId(categoryId);
        product.setPrice(BigDecimal.valueOf(price));
        product.setStock(2);
        product.setIsActive(true);
        return product;
    }
}