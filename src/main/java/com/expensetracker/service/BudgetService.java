package com.expensetracker.service;

import com.expensetracker.dto.BudgetDtos.*;
import java.util.List;

public interface BudgetService {
    List<BudgetDTO> getAllBudgets();
    BudgetDTO getBudgetById(Long id);
    BudgetDTO createBudget(BudgetRequest request);
    BudgetDTO updateBudget(Long id, BudgetRequest request);
    void deleteBudget(Long id);
    void checkBudgetLimit(Long categoryId, Integer month, Integer year);
}
