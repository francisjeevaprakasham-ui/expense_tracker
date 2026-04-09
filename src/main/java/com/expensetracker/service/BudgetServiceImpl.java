package com.expensetracker.service;

import com.expensetracker.dto.BudgetDtos.*;
import com.expensetracker.exception.DuplicateResourceException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.mapper.BudgetMapper;
import com.expensetracker.model.Budget;
import com.expensetracker.model.Category;
import com.expensetracker.model.User;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BudgetServiceImpl implements BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final BudgetMapper budgetMapper;
    private final UserService userService;

    public BudgetServiceImpl(BudgetRepository budgetRepository, CategoryRepository categoryRepository, BudgetMapper budgetMapper, UserService userService) {
        this.budgetRepository = budgetRepository;
        this.categoryRepository = categoryRepository;
        this.budgetMapper = budgetMapper;
        this.userService = userService;
    }

    @Override
    public List<BudgetDTO> getAllBudgets() {
        User user = userService.getCurrentUserEntity();
        return budgetRepository.findByUserId(user.getId())
                .stream().map(budgetMapper::toDto).collect(Collectors.toList());
    }

    @Override
    public BudgetDTO getBudgetById(Long id) {
        User user = userService.getCurrentUserEntity();
        return budgetRepository.findByIdAndUserId(id, user.getId())
                .map(budgetMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found"));
    }

    @Override
    public BudgetDTO createBudget(BudgetRequest request) {
        User user = userService.getCurrentUserEntity();
        
        Long catId = request.categoryId();
        if (budgetRepository.findByUserIdAndCategoryIdAndMonthAndYear(user.getId(), catId, request.month(), request.year()).isPresent()) {
            throw new DuplicateResourceException("Budget for this category and month/year already exists");
        }
        
        Budget budget = budgetMapper.toEntity(request);
        budget.setUser(user);
        
        if (catId != null) {
            Category category = categoryRepository.findByIdAndUserId(catId, user.getId())
                    .orElseGet(() -> categoryRepository.findById(catId)
                            .filter(c -> c.getUser() == null)
                            .orElseThrow(() -> new ResourceNotFoundException("Category not found")));
            budget.setCategory(category);
        }
        
        return budgetMapper.toDto(budgetRepository.save(budget));
    }

    @Override
    public BudgetDTO updateBudget(Long id, BudgetRequest request) {
        User user = userService.getCurrentUserEntity();
        Budget budget = budgetRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found"));
                
        budget.setMonthlyLimit(request.monthlyLimit());
        budget.setMonth(request.month());
        budget.setYear(request.year());
        
        if (request.categoryId() != null) {
            Category category = categoryRepository.findByIdAndUserId(request.categoryId(), user.getId())
                    .orElseGet(() -> categoryRepository.findById(request.categoryId())
                            .filter(c -> c.getUser() == null)
                            .orElseThrow(() -> new ResourceNotFoundException("Category not found")));
            budget.setCategory(category);
        } else {
            budget.setCategory(null);
        }
        
        return budgetMapper.toDto(budgetRepository.save(budget));
    }

    @Override
    public void deleteBudget(Long id) {
        User user = userService.getCurrentUserEntity();
        Budget budget = budgetRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found"));
        budgetRepository.delete(budget);
    }
    
    @Override
    public void checkBudgetLimit(Long categoryId, Integer month, Integer year) {
        // Implementation can check against expenses to alert/throw
    }
}
