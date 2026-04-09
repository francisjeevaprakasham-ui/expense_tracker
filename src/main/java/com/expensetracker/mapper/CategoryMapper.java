package com.expensetracker.mapper;

import com.expensetracker.dto.CategoryDtos.CategoryDTO;
import com.expensetracker.dto.CategoryDtos.CategoryRequest;
import com.expensetracker.model.Category;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    CategoryDTO toDto(Category category);
    Category toEntity(CategoryRequest request);
}
