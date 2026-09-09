package com.enterprise.catalog.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.enterprise.catalog.dto.CategoryRequest;
import com.enterprise.catalog.exception.CatalogBadRequestException;
import com.enterprise.catalog.exception.CatalogNotFoundException;
import com.enterprise.catalog.model.Category;
import com.enterprise.catalog.model.Product;
import com.enterprise.catalog.repository.CategoryRepository;
import com.enterprise.catalog.repository.ProductRepository;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductRepository productRepository;

    private CategoryService service;

    @BeforeEach
    void setUp() {
        service = new CategoryService(categoryRepository, productRepository);
    }

    @Test
    void createsCategoryWithTrimmedValues() {
        when(categoryRepository.findByNameIgnoreCase("Office")).thenReturn(Optional.empty());
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(new CategoryRequest(" Office ", " Office supplies "));

        assertThat(response.name()).isEqualTo("Office");
        assertThat(response.description()).isEqualTo("Office supplies");
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    void rejectsBlankCategoryName() {
        assertThatThrownBy(() -> service.create(new CategoryRequest(" ", null)))
                .isInstanceOf(CatalogBadRequestException.class)
                .hasMessage("Category name is required.");

        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void deletingCategoryUnlinksProducts() {
        Category category = new Category("Office", null);
        category.setId("category-1");
        Product product = new Product();
        product.setCategoryId("category-1");
        when(categoryRepository.findById("category-1")).thenReturn(Optional.of(category));
        when(productRepository.findAllByCategoryId("category-1")).thenReturn(List.of(product));

        service.delete("category-1");

        assertThat(product.getCategoryId()).isNull();
        verify(productRepository).saveAll(List.of(product));
        verify(categoryRepository).delete(category);
    }

    @Test
    void missingCategoryReturnsNotFound() {
        when(categoryRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById("missing"))
                .isInstanceOf(CatalogNotFoundException.class)
                .hasMessage("Category not found.");
    }
}