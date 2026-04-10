package com.expensetracker.dto;

import com.expensetracker.dto.CategoryDtos.CategoryDTO;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class AdminDtos {
    public record AdminExpenseDTO(
        Long id,
        BigDecimal amount,
        String description,
        LocalDate date,
        CategoryDTO category,
        List<String> tags,
        Long userId,
        String userFullName,
        String userEmail
    ) {}
}
