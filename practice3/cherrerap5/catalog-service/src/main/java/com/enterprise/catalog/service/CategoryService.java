package com.enterprise.catalog.service;

import java.util.List;

import com.enterprise.catalog.dto.CategoryDto;
import com.enterprise.catalog.model.Category;

public interface CategoryService {
    List<CategoryDto> getActiveCategories();
    Category requireActive(String id);
}
