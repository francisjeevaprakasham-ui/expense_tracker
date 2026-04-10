package com.expensetracker.controller;

import com.expensetracker.dto.AdminDtos.AdminExpenseDTO;
import com.expensetracker.dto.ApiResponse;
import com.expensetracker.dto.BudgetDtos.BudgetDTO;
import com.expensetracker.dto.BudgetDtos.BudgetRequest;
import com.expensetracker.dto.CategoryDtos.CategoryDTO;
import com.expensetracker.dto.CategoryDtos.CategoryRequest;
import com.expensetracker.dto.UserDTO;
import com.expensetracker.model.Role;
import com.expensetracker.service.AdminService;
import com.expensetracker.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final AdminService adminService;

    public AdminController(UserService userService, AdminService adminService) {
        this.userService = userService;
        this.adminService = adminService;
    }

    // ── User Management ──────────────────────────────────────────
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Users fetched", userService.getAllUsers()));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<UserDTO>> updateRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Role role = Role.valueOf(body.get("role").toUpperCase());
        return ResponseEntity.ok(new ApiResponse<>(true, "Role updated", userService.updateUserRole(id, role)));
    }

    // ── All Expenses View ─────────────────────────────────────────
    @GetMapping("/expenses")
    public ResponseEntity<ApiResponse<List<AdminExpenseDTO>>> getAllExpenses() {
        return ResponseEntity.ok(new ApiResponse<>(true, "All expenses fetched", adminService.getAllExpenses()));
    }

    // ── Create Category for User ──────────────────────────────────
    @PostMapping("/users/{userId}/categories")
    public ResponseEntity<ApiResponse<CategoryDTO>> createCategoryForUser(
            @PathVariable Long userId,
            @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Category created",
                adminService.createCategoryForUser(userId, request)));
    }

    // ── Create Budget for User ────────────────────────────────────
    @PostMapping("/users/{userId}/budgets")
    public ResponseEntity<ApiResponse<BudgetDTO>> createBudgetForUser(
            @PathVariable Long userId,
            @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Budget created",
                adminService.createBudgetForUser(userId, request)));
    }
}
