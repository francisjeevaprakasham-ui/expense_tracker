package com.expensetracker.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import com.expensetracker.dto.CategoryDtos.CategoryDTO;

public final class ExpenseDtos {
    public record ExpenseDTO(Long id, BigDecimal amount, String description, LocalDate date, CategoryDTO category, List<String> tags) {}
    
    public record ExpenseRequest(
        @NotNull @Positive BigDecimal amount,
        String description,
        @NotNull LocalDate date,
        Long categoryId,
        List<String> tags
    ) {}
}
