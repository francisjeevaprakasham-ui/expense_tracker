package com.expensetracker.service;

import com.expensetracker.dto.AuthDtos.*;

public interface AuthService {
    AuthResponse login(AuthRequest request);
    AuthResponse register(RegisterRequest request);
}
