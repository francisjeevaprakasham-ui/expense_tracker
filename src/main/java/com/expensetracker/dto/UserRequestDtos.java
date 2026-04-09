package com.expensetracker.dto;

import jakarta.validation.constraints.NotBlank;

public final class UserRequestDtos {
    public record UserProfileUpdateRequest(@NotBlank String firstName, @NotBlank String lastName) {}
    public record PasswordUpdateRequest(@NotBlank String oldPassword, @NotBlank String newPassword) {}
}
