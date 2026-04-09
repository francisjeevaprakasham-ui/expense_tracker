package com.expensetracker.service;

import com.expensetracker.dto.ExpenseDtos.*;
import com.expensetracker.dto.PagedResponse;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.mapper.ExpenseMapper;
import com.expensetracker.model.Category;
import com.expensetracker.model.Expense;
import com.expensetracker.model.User;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;
    private final ExpenseMapper expenseMapper;
    private final UserService userService;

    public ExpenseServiceImpl(ExpenseRepository expenseRepository, CategoryRepository categoryRepository, ExpenseMapper expenseMapper, UserService userService) {
        this.expenseRepository = expenseRepository;
        this.categoryRepository = categoryRepository;
        this.expenseMapper = expenseMapper;
        this.userService = userService;
    }

    @Override
    public PagedResponse<ExpenseDTO> getAllExpenses(int page, int size, Long categoryId, String from, String to, String tag) {
        User user = userService.getCurrentUserEntity();
        
        Specification<Expense> spec = (root, query, cb) -> {
            var predicates = cb.conjunction();
            predicates.getExpressions().add(cb.equal(root.get("user").get("id"), user.getId()));
            
            if (categoryId != null) {
                predicates.getExpressions().add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (from != null && !from.isEmpty()) {
                predicates.getExpressions().add(cb.greaterThanOrEqualTo(root.get("date"), LocalDate.parse(from)));
            }
            if (to != null && !to.isEmpty()) {
                predicates.getExpressions().add(cb.lessThanOrEqualTo(root.get("date"), LocalDate.parse(to)));
            }
            return predicates;
        };

        Page<Expense> expensePage = expenseRepository.findAll(spec, PageRequest.of(page, size));
        List<ExpenseDTO> content = expensePage.getContent().stream()
                .map(expenseMapper::toDto)
                .collect(Collectors.toList());

        return new PagedResponse<>(content, expensePage.getNumber(), expensePage.getSize(),
                expensePage.getTotalElements(), expensePage.getTotalPages(), expensePage.isLast());
    }

    @Override
    public ExpenseDTO getExpenseById(Long id) {
        User user = userService.getCurrentUserEntity();
        Expense expense = expenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));
        return expenseMapper.toDto(expense);
    }

    @Override
    public ExpenseDTO createExpense(ExpenseRequest request) {
        User user = userService.getCurrentUserEntity();
        Expense expense = expenseMapper.toEntity(request);
        expense.setUser(user);

        if (request.categoryId() != null) {
            Category category = categoryRepository.findByIdAndUserId(request.categoryId(), user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            expense.setCategory(category);
        }

        return expenseMapper.toDto(expenseRepository.save(expense));
    }

    @Override
    public ExpenseDTO updateExpense(Long id, ExpenseRequest request) {
        User user = userService.getCurrentUserEntity();
        Expense expense = expenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));

        expense.setAmount(request.amount());
        expense.setDescription(request.description());
        expense.setDate(request.date());
        if (request.tags() != null) {
            expense.setTags(request.tags().toArray(new String[0]));
        } else {
            expense.setTags(null);
        }

        if (request.categoryId() != null) {
            Category category = categoryRepository.findByIdAndUserId(request.categoryId(), user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            expense.setCategory(category);
        } else {
            expense.setCategory(null);
        }

        return expenseMapper.toDto(expenseRepository.save(expense));
    }

    @Override
    public void deleteExpense(Long id) {
        User user = userService.getCurrentUserEntity();
        Expense expense = expenseRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));
        expenseRepository.delete(expense);
    }
}
