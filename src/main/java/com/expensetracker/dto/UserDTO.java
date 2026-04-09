package com.expensetracker.dto;

import jakarta.validation.constraints.NotBlank;

public record UserDTO(Long id, String firstName, String lastName, String email, String role) {}
