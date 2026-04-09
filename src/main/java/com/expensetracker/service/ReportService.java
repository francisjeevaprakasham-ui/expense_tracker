package com.expensetracker.service;

import java.util.Map;

public interface ReportService {
    Map<String, Object> getMonthlySummary(Integer month, Integer year);
    Map<String, Object> getYearlySummary(Integer year);
    Map<String, Object> getSpendingByCategory(String from, String to);
    Map<String, Object> getTopCategories(String from, String to, int limit);
}
