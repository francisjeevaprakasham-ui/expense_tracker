package com.expensetracker.dto;

import jakarta.validation.constraints.NotBlank;

public final class CategoryDtos {
    public record CategoryDTO(Long id, String name, String color, String icon) {}
    public record CategoryRequest(@NotBlank String name, String color, String icon) {}
}
