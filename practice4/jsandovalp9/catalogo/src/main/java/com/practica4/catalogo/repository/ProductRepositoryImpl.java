package com.practica4.catalogo.repository;

import com.practica4.catalogo.entity.Product;
import com.practica4.catalogo.entity.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ProductRepositoryImpl implements ProductRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    public ProductRepositoryImpl(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public Page<Product> findAll(ProductStatus status, String sku, String search, Pageable pageable) {
        Query query = new Query();

        if (status != null) {
            query.addCriteria(Criteria.where("status").is(status));
        }
        if (sku != null && !sku.isBlank()) {
            query.addCriteria(Criteria.where("sku").is(sku));
        }
        if (search != null && !search.isBlank()) {
            String regex = "(?i).*" + search.trim() + ".*";
            query.addCriteria(new Criteria().orOperator(
                    Criteria.where("name").regex(regex),
                    Criteria.where("description").regex(regex)
            ));
        }

        long total = mongoTemplate.count(query, Product.class);
        query.with(pageable);
        List<Product> products = mongoTemplate.find(query, Product.class);
        return new PageImpl<>(products, pageable, total);
    }
}
