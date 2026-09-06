package com.enterprise.catalog.repository;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.regex.Pattern;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import com.enterprise.catalog.model.Product;

public class ProductSearchRepositoryImpl implements ProductSearchRepository {

    private final MongoTemplate mongoTemplate;

    public ProductSearchRepositoryImpl(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public Page<Product> search(String search, String categoryId, Collection<String> categoryIdsByName,
                                String sortBy, String sortDirection, int page, int pageSize) {
        List<Criteria> filters = new ArrayList<>();
        if (categoryId != null && !categoryId.isBlank()) {
            filters.add(Criteria.where("categoryId").is(categoryId));
        }
        if (search != null && !search.isBlank()) {
            Pattern pattern = Pattern.compile(Pattern.quote(search.trim()), Pattern.CASE_INSENSITIVE);
            List<Criteria> matches = new ArrayList<>();
            matches.add(Criteria.where("name").regex(pattern));
            matches.add(Criteria.where("description").regex(pattern));
            if (!categoryIdsByName.isEmpty()) {
                matches.add(Criteria.where("categoryId").in(categoryIdsByName));
            }
            filters.add(new Criteria().orOperator(matches));
        }

        Criteria combinedCriteria = null;
        if (!filters.isEmpty()) {
            combinedCriteria = new Criteria().andOperator(filters);
        }
        Query query = combinedCriteria == null ? new Query() : new Query(combinedCriteria);

        long total = mongoTemplate.count(query, Product.class);
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String property = switch (sortBy == null ? "" : sortBy.toLowerCase()) {
            case "price" -> "price";
            case "stock" -> "stock";
            case "createdat" -> "createdAt";
            case "category" -> "category";
            default -> "name";
        };
        Sort responseSort = Sort.by(direction, property).and(Sort.by(Sort.Direction.ASC, "id"));
        PageRequest pageable = PageRequest.of(page - 1, pageSize, responseSort);
        List<Product> products;
        if ("category".equals(property)) {
            List<org.springframework.data.mongodb.core.aggregation.AggregationOperation> operations = new ArrayList<>();
            if (combinedCriteria != null) operations.add(Aggregation.match(combinedCriteria));
            operations.add(Aggregation.lookup("categories", "categoryId", "_id", "category"));
            operations.add(Aggregation.unwind("category", true));
            operations.add(Aggregation.sort(Sort.by(direction, "category.name").and(Sort.by("_id"))));
            operations.add(Aggregation.skip((long) (page - 1) * pageSize));
            operations.add(Aggregation.limit(pageSize));
            products = mongoTemplate.aggregate(Aggregation.newAggregation(operations), "products", Product.class)
                    .getMappedResults();
        } else {
            query.with(PageRequest.of(page - 1, pageSize,
                    Sort.by(direction, property).and(Sort.by(Sort.Direction.ASC, "id"))));
            products = mongoTemplate.find(query, Product.class);
        }
        return new PageImpl<>(products, pageable, total);
    }
}
