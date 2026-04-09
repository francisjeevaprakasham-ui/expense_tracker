package com.expensetracker.service;

import com.expensetracker.dto.CategoryDtos.*;
import java.util.List;

public interface CategoryService {
    List<CategoryDTO> getAllCategories();
    CategoryDTO createCategory(CategoryRequest request);
    CategoryDTO updateCategory(Long id, CategoryRequest request);
    void deleteCategory(Long id);
}
