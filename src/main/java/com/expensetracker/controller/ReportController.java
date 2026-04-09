package com.expensetracker.controller;

import com.expensetracker.dto.ApiResponse;
import com.expensetracker.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/monthly")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMonthlySummary(@RequestParam Integer month, @RequestParam Integer year) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Monthly summary", reportService.getMonthlySummary(month, year)));
    }

    @GetMapping("/yearly")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getYearlySummary(@RequestParam Integer year) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Yearly summary", reportService.getYearlySummary(year)));
    }

    @GetMapping("/by-category")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSpendingByCategory(@RequestParam String from, @RequestParam String to) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Spending by category", reportService.getSpendingByCategory(from, to)));
    }

    @GetMapping("/top-categories")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTopCategories(
            @RequestParam String from, 
            @RequestParam String to, 
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Top categories", reportService.getTopCategories(from, to, limit)));
    }
}
