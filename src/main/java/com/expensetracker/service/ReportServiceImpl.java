package com.expensetracker.service;

import com.expensetracker.model.Budget;
import com.expensetracker.model.User;
import com.expensetracker.repository.BudgetRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.LinkedHashMap;

@Service
public class ReportServiceImpl implements ReportService {

    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;
    private final BudgetRepository budgetRepository;
    private final UserService userService;

    public ReportServiceImpl(ExpenseRepository expenseRepository, CategoryRepository categoryRepository,
                             BudgetRepository budgetRepository, UserService userService) {
        this.expenseRepository = expenseRepository;
        this.categoryRepository = categoryRepository;
        this.budgetRepository = budgetRepository;
        this.userService = userService;
    }

    @Override
    public Map<String, Object> getMonthlySummary(Integer month, Integer year) {
        User user = userService.getCurrentUserEntity();
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        // Total spent this month (all categories)
        List<Object[]> results = expenseRepository.sumAmountByCategoryAndDateRange(user.getId(), start, end);
        BigDecimal totalSpent = BigDecimal.ZERO;
        for (Object[] row : results) {
            if (row[1] != null) totalSpent = totalSpent.add((BigDecimal) row[1]);
        }

        // Sum of all budget limits for this month/year
        BigDecimal budgetLimit = budgetRepository.findByUserId(user.getId()).stream()
                .filter(b -> b.getMonth().equals(month) && b.getYear().equals(year))
                .map(Budget::getMonthlyLimit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        double spentPct = budgetLimit.compareTo(BigDecimal.ZERO) > 0
                ? totalSpent.multiply(BigDecimal.valueOf(100))
                            .divide(budgetLimit, 2, RoundingMode.HALF_UP)
                            .doubleValue()
                : 0.0;

        return Map.of(
            "totalSpent",       totalSpent,
            "budgetLimit",      budgetLimit,
            "spentPercentage",  spentPct,
            "month",            month,
            "year",             year
        );
    }

    @Override
    public Map<String, Object> getYearlySummary(Integer year) {
        User user = userService.getCurrentUserEntity();
        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = LocalDate.of(year, 12, 31);
        return generateSummary(user.getId(), start, end);
    }

    @Override
    public Map<String, Object> getSpendingByCategory(String from, String to) {
         User user = userService.getCurrentUserEntity();
         LocalDate start = LocalDate.parse(from);
         LocalDate end = LocalDate.parse(to);
         List<Object[]> results = expenseRepository.sumAmountByCategoryAndDateRange(user.getId(), start, end);
         
         Map<String, BigDecimal> spendingMap = new LinkedHashMap<>();
         for (Object[] row : results) {
             Long catId = (Long) row[0];
             BigDecimal amount = (BigDecimal) row[1];
             String catName = "Uncategorized";
             if (catId != null) {
                 catName = categoryRepository.findById(catId).map(c -> c.getName()).orElse(catName);
             }
             spendingMap.put(catName, amount);
         }
         return Map.of("spending", spendingMap);
    }

    @Override
    public Map<String, Object> getTopCategories(String from, String to, int limit) {
         Map<String, Object> spending = getSpendingByCategory(from, to);
         
         @SuppressWarnings("unchecked")
         Map<String, BigDecimal> data = (Map<String, BigDecimal>) spending.get("spending");
         
         Map<String, BigDecimal> top = data.entrySet().stream()
                 .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                 .limit(limit)
                 .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (e1, e2) -> e1, LinkedHashMap::new));
                 
         return Map.of("topCategories", top);
    }
    
    private Map<String, Object> generateSummary(Long userId, LocalDate start, LocalDate end) {
        List<Object[]> results = expenseRepository.sumAmountByCategoryAndDateRange(userId, start, end);
        BigDecimal total = BigDecimal.ZERO;
        for (Object[] row : results) {
            if (row[1] != null) total = total.add((BigDecimal) row[1]);
        }
        return Map.of(
            "totalSpent",   total,
            "periodStart",  start.toString(),
            "periodEnd",    end.toString()
        );
    }
}
