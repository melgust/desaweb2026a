package com.enterprise.catalog.config;

import com.enterprise.catalog.model.Category;
import com.enterprise.catalog.repository.CategoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    private static final String[] DEFAULT_CATEGORIES = { "Electronics", "Office Supplies", "Furniture" };

    public DataSeeder(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public void run(String... args) {
        for (String name : DEFAULT_CATEGORIES) {
            if (!categoryRepository.existsByNameIgnoreCase(name)) {
                categoryRepository.save(new Category(name, null));
            }
        }
    }
}
