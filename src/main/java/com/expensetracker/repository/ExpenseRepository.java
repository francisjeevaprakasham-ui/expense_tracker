package com.expensetracker.repository;

import com.expensetracker.model.Expense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long>, JpaSpecificationExecutor<Expense> {
    Page<Expense> findByUserId(Long userId, Pageable pageable);
    
    Optional<Expense> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.user.id = :userId " +
           "AND e.category.id = :categoryId " +
           "AND EXTRACT(MONTH FROM e.date) = :month " +
           "AND EXTRACT(YEAR FROM e.date) = :year")
    BigDecimal sumAmountByUserIdAndCategoryIdAndMonthAndYear(
            @Param("userId") Long userId, 
            @Param("categoryId") Long categoryId, 
            @Param("month") Integer month, 
            @Param("year") Integer year);
            
    // Grouped sums (for report service)
    @Query("SELECT e.category.id, SUM(e.amount) FROM Expense e WHERE e.user.id = :userId " +
           "AND e.date BETWEEN :startDate AND :endDate GROUP BY e.category.id")
    List<Object[]> sumAmountByCategoryAndDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
