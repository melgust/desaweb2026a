package com.enterprise.catalog.config;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.enterprise.catalog.model.Category;
import com.enterprise.catalog.model.Product;
import com.enterprise.catalog.model.Supplier;
import com.enterprise.catalog.repository.CategoryRepository;
import com.enterprise.catalog.repository.ProductRepository;
import com.enterprise.catalog.repository.SupplierRepository;

@Component
public class CatalogDataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;

    public CatalogDataInitializer(
            CategoryRepository categoryRepository,
            ProductRepository productRepository,
            SupplierRepository supplierRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.supplierRepository = supplierRepository;
    }

    @Override
    public void run(String... args) {
        List<Category> categories = seedCategories();
        seedProducts(categories);
        seedSuppliers();
    }

    private List<Category> seedCategories() {
        if (categoryRepository.count() > 0) {
            return categoryRepository.findAll();
        }

        return categoryRepository.saveAll(List.of(
                new Category("Electronics", "Electronics category"),
                new Category("Home", "Home category"),
                new Category("Office", "Office category"),
                new Category("Accessories", "Accessories category"),
                new Category("Sport", "Sport category")));
    }

    private void seedProducts(List<Category> categories) {
        if (productRepository.count() > 0 || categories.isEmpty()) {
            return;
        }

        productRepository.saveAll(List.of(
                product("Inventory Product 001", "Demo inventory item 001.", "9.99", 25, categories.get(0)),
                product("Inventory Product 002", "Demo inventory item 002.", "19.99", 40, categories.get(1)),
                product("Inventory Product 003", "Demo inventory item 003.", "29.99", 15, categories.get(2)),
                product("Inventory Product 004", "Demo inventory item 004.", "39.99", 60, categories.get(3)),
                product("Inventory Product 005", "Demo inventory item 005.", "49.99", 10, categories.get(4))));
    }

    private void seedSuppliers() {
        if (supplierRepository.count() > 0) {
            return;
        }

        Supplier first = supplier("Demo Supplier One", "DEMO-001", "supplier1@example.com");
        Supplier second = supplier("Demo Supplier Two", "DEMO-002", "supplier2@example.com");
        supplierRepository.saveAll(List.of(first, second));
    }

    private static Product product(String name, String description, String price, int stock, Category category) {
        Product product = new Product();
        product.setName(name);
        product.setDescription(description);
        product.setPrice(new BigDecimal(price));
        product.setStock(stock);
        product.setIsActive(true);
        product.setCategoryId(category.getId());
        return product;
    }

    private static Supplier supplier(String name, String taxId, String email) {
        Supplier supplier = new Supplier();
        supplier.setName(name);
        supplier.setTaxId(taxId);
        supplier.setEmail(email);
        supplier.setIsActive(true);
        return supplier;
    }
}