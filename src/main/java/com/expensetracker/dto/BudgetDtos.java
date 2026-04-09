package com.expensetracker.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import com.expensetracker.dto.CategoryDtos.CategoryDTO;

public final class BudgetDtos {
    public record BudgetDTO(Long id, BigDecimal monthlyLimit, Integer month, Integer year, CategoryDTO category) {}
    
    public record BudgetRequest(
        @NotNull @Positive BigDecimal monthlyLimit,
        @NotNull Integer month,
        @NotNull Integer year,
        Long categoryId
    ) {}
}
