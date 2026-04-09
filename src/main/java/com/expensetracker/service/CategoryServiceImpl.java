package com.expensetracker.service;

import com.expensetracker.dto.CategoryDtos.*;
import com.expensetracker.exception.DuplicateResourceException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.mapper.CategoryMapper;
import com.expensetracker.model.Category;
import com.expensetracker.model.User;
import com.expensetracker.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final UserService userService;

    public CategoryServiceImpl(CategoryRepository categoryRepository, CategoryMapper categoryMapper, UserService userService) {
        this.categoryRepository = categoryRepository;
        this.categoryMapper = categoryMapper;
        this.userService = userService;
    }

    @Override
    public List<CategoryDTO> getAllCategories() {
        User user = userService.getCurrentUserEntity();
        return categoryRepository.findByUserId(user.getId())
                .stream()
                .map(categoryMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public CategoryDTO createCategory(CategoryRequest request) {
        User user = userService.getCurrentUserEntity();
        if (categoryRepository.existsByNameAndUserId(request.name(), user.getId())) {
            throw new DuplicateResourceException("Category with this name already exists");
        }
        Category category = categoryMapper.toEntity(request);
        category.setUser(user);
        return categoryMapper.toDto(categoryRepository.save(category));
    }

    @Override
    public CategoryDTO updateCategory(Long id, CategoryRequest request) {
        User user = userService.getCurrentUserEntity();
        Category category = categoryRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
                
        if (!category.getName().equals(request.name()) && categoryRepository.existsByNameAndUserId(request.name(), user.getId())) {
            throw new DuplicateResourceException("Category with this name already exists");
        }
        
        category.setName(request.name());
        category.setColor(request.color());
        category.setIcon(request.icon());
        return categoryMapper.toDto(categoryRepository.save(category));
    }

    @Override
    public void deleteCategory(Long id) {
        User user = userService.getCurrentUserEntity();
        Category category = categoryRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        categoryRepository.delete(category);
    }
}
