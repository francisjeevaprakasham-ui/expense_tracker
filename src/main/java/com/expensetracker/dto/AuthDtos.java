package com.expensetracker.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public final class AuthDtos {
    public record AuthRequest(@NotBlank String email, @NotBlank String password) {}
    
    public record RegisterRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank @Email String email,
        @NotBlank String password
    ) {}
    
    public record AuthResponse(String token, String type, UserDTO user) {}
}
