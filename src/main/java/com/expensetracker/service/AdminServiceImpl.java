package com.expensetracker.service;

import com.expensetracker.dto.AdminDtos.AdminExpenseDTO;
import com.expensetracker.dto.BudgetDtos.BudgetDTO;
import com.expensetracker.dto.BudgetDtos.BudgetRequest;
import com.expensetracker.dto.CategoryDtos.CategoryDTO;
import com.expensetracker.dto.CategoryDtos.CategoryRequest;
import com.expensetracker.exception.DuplicateResourceException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.mapper.BudgetMapper;
import com.expensetracker.mapper.CategoryMapper;
import com.expensetracker.model.Budget;
import com.expensetracker.model.Category;
import com.expensetracker.model.Expense;
import com.expensetracker.model.User;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminServiceImpl implements AdminService {

    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;
    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final CategoryMapper categoryMapper;
    private final BudgetMapper budgetMapper;

    public AdminServiceImpl(ExpenseRepository expenseRepository,
                            CategoryRepository categoryRepository,
                            BudgetRepository budgetRepository,
                            UserRepository userRepository,
                            CategoryMapper categoryMapper,
                            BudgetMapper budgetMapper) {
        this.expenseRepository = expenseRepository;
        this.categoryRepository = categoryRepository;
        this.budgetRepository = budgetRepository;
        this.userRepository = userRepository;
        this.categoryMapper = categoryMapper;
        this.budgetMapper = budgetMapper;
    }

    @Override
    public List<AdminExpenseDTO> getAllExpenses() {
        // Fetch all expenses sorted by date desc, limit 500 for safety
        List<Expense> expenses = expenseRepository.findAll(
                PageRequest.of(0, 500, Sort.by(Sort.Direction.DESC, "date"))
        ).getContent();

        return expenses.stream().map(e -> {
            User u = e.getUser();
            String fullName = (u != null) ? (u.getFirstName() + " " + u.getLastName()).trim() : "Unknown";
            String email    = (u != null) ? u.getEmail() : "";
            Long userId     = (u != null) ? u.getId() : null;

            return new AdminExpenseDTO(
                e.getId(),
                e.getAmount(),
                e.getDescription(),
                e.getDate(),
                e.getCategory() != null ? categoryMapper.toDto(e.getCategory()) : null,
                e.getTags() != null ? Arrays.asList(e.getTags()) : null,
                userId,
                fullName,
                email
            );
        }).collect(Collectors.toList());
    }

    @Override
    public CategoryDTO createCategoryForUser(Long userId, CategoryRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (categoryRepository.existsByNameAndUserId(request.name(), userId)) {
            throw new DuplicateResourceException("Category with this name already exists for this user");
        }

        Category category = categoryMapper.toEntity(request);
        category.setUser(user);
        return categoryMapper.toDto(categoryRepository.save(category));
    }

    @Override
    public BudgetDTO createBudgetForUser(Long userId, BudgetRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (budgetRepository.findByUserIdAndCategoryIdAndMonthAndYear(
                userId, request.categoryId(), request.month(), request.year()).isPresent()) {
            throw new DuplicateResourceException("Budget for this category and month/year already exists");
        }

        Budget budget = budgetMapper.toEntity(request);
        budget.setUser(user);

        if (request.categoryId() != null) {
            Category category = categoryRepository.findByIdAndUserId(request.categoryId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found for this user"));
            budget.setCategory(category);
        }

        return budgetMapper.toDto(budgetRepository.save(budget));
    }
}
