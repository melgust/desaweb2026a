package com.enterprise.catalog.config;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.enterprise.catalog.model.Category;
import com.enterprise.catalog.model.Product;
import com.enterprise.catalog.repository.CategoryRepository;
import com.enterprise.catalog.repository.ProductRepository;

@Component
public class CatalogDataInitializer implements ApplicationRunner {

    private static final List<String> CATEGORY_NAMES = List.of(
            "General", "Laptop", "Monitor", "Teclado", "Mouse", "Audifonos",
            "Webcam", "Impresora", "Router", "Disco SSD", "Memoria RAM");
    private static final List<String> PRODUCT_CATEGORIES = CATEGORY_NAMES.subList(1, CATEGORY_NAMES.size());
    private static final List<String> BRANDS = List.of("Nova", "Atlas", "Orion", "Vertex", "Nimbus", "Quantum");

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final int configuredProductCount;

    public CatalogDataInitializer(
            CategoryRepository categoryRepository,
            ProductRepository productRepository,
            @Value("${catalog.seed.product-count:75}") int configuredProductCount) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.configuredProductCount = configuredProductCount;
    }

    @Override
    public void run(ApplicationArguments args) {
        Map<String, Category> categoriesByName = ensureCategories();
        ensureProducts(categoriesByName);
    }

    private Map<String, Category> ensureCategories() {
        Map<String, Category> categoriesByName = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(
                        category -> normalize(category.getName()),
                        Function.identity(),
                        (first, ignored) -> first));

        Instant now = Instant.now();
        List<Category> missingCategories = CATEGORY_NAMES.stream()
                .filter(name -> !categoriesByName.containsKey(normalize(name)))
                .map(name -> new Category(
                        stableId("category", name),
                        name,
                        name.equals("General")
                                ? "Productos sin una categoria especifica"
                                : "Productos de tipo " + name,
                        true,
                        now))
                .toList();

        if (!missingCategories.isEmpty()) {
            categoryRepository.saveAll(missingCategories);
            missingCategories.forEach(category -> categoriesByName.put(normalize(category.getName()), category));
        }

        return categoriesByName;
    }

    private void ensureProducts(Map<String, Category> categoriesByName) {
        int productCount = Math.max(0, Math.min(configuredProductCount, 10_000));
        Set<String> existingNames = productRepository.findAll().stream()
                .map(Product::getName)
                .collect(Collectors.toSet());
        Instant now = Instant.now();

        List<Product> missingProducts = java.util.stream.IntStream.rangeClosed(1, productCount)
                .mapToObj(index -> createProduct(index, categoriesByName, now))
                .filter(product -> !existingNames.contains(product.getName()))
                .toList();

        if (!missingProducts.isEmpty()) {
            productRepository.saveAll(missingProducts);
        }
    }

    private Product createProduct(int index, Map<String, Category> categoriesByName, Instant now) {
        String categoryName = PRODUCT_CATEGORIES.get((index - 1) % PRODUCT_CATEGORIES.size());
        String brand = BRANDS.get(((index - 1) / PRODUCT_CATEGORIES.size()) % BRANDS.size());
        String name = "INV-%04d | %s %s".formatted(index, categoryName, brand);
        BigDecimal price = BigDecimal.valueOf(149.90)
                .add(BigDecimal.valueOf(index)
                        .multiply(BigDecimal.valueOf(37.45))
                        .remainder(BigDecimal.valueOf(18_500)))
                .setScale(2, RoundingMode.HALF_UP);
        Instant createdAt = now.minus(index, ChronoUnit.MINUTES);

        return new Product(
                stableId("product", name),
                name,
                "Producto de demostracion para inventario: %s marca %s.".formatted(categoryName, brand),
                price,
                (index * 17) % 151,
                categoriesByName.get(normalize(categoryName)).getId(),
                index % 13 != 0,
                createdAt,
                createdAt);
    }

    private static String stableId(String type, String value) {
        return UUID.nameUUIDFromBytes((type + ":" + value).getBytes(StandardCharsets.UTF_8)).toString();
    }

    private static String normalize(String value) {
        return value.toLowerCase(Locale.ROOT);
    }
}
