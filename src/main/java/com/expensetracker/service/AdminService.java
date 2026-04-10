package com.expensetracker.service;

import com.expensetracker.dto.AdminDtos.AdminExpenseDTO;
import com.expensetracker.dto.BudgetDtos.BudgetDTO;
import com.expensetracker.dto.BudgetDtos.BudgetRequest;
import com.expensetracker.dto.CategoryDtos.CategoryDTO;
import com.expensetracker.dto.CategoryDtos.CategoryRequest;

import java.util.List;

public interface AdminService {
    List<AdminExpenseDTO> getAllExpenses();
    CategoryDTO createCategoryForUser(Long userId, CategoryRequest request);
    BudgetDTO createBudgetForUser(Long userId, BudgetRequest request);
}
