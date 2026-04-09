package com.expensetracker.controller;

import com.expensetracker.dto.ApiResponse;
import com.expensetracker.dto.BudgetDtos.*;
import com.expensetracker.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BudgetDTO>>> getAllBudgets() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Budgets retrieved", budgetService.getAllBudgets()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BudgetDTO>> getBudgetById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Budget retrieved", budgetService.getBudgetById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BudgetDTO>> createBudget(@Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Budget created", budgetService.createBudget(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BudgetDTO>> updateBudget(@PathVariable Long id, @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Budget updated", budgetService.updateBudget(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBudget(@PathVariable Long id) {
        budgetService.deleteBudget(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Budget deleted", null));
    }
}
