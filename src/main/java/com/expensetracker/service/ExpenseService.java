package com.expensetracker.service;

import com.expensetracker.dto.ExpenseDtos.*;
import com.expensetracker.dto.PagedResponse;

public interface ExpenseService {
    PagedResponse<ExpenseDTO> getAllExpenses(int page, int size, Long categoryId, String from, String to, String tag);
    ExpenseDTO getExpenseById(Long id);
    ExpenseDTO createExpense(ExpenseRequest request);
    ExpenseDTO updateExpense(Long id, ExpenseRequest request);
    void deleteExpense(Long id);
}
