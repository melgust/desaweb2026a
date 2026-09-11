package com.gt.catalog.factunet;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;

    public DataSeeder(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        if (productRepository.count() == 0) {
            productRepository.save(new Product("Laptop", 1200.00, "Tecnologia"));
            productRepository.save(new Product("Mouse", 25.50, "Accesorios"));
            productRepository.save(new Product("Teclado", 80.00, "Accesorios"));
        }
    }
}
