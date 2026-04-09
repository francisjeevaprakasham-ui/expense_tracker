package com.expensetracker.service;

import com.expensetracker.dto.ExpenseDtos.*;
import com.expensetracker.mapper.ExpenseMapper;
import com.expensetracker.model.Expense;
import com.expensetracker.model.User;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ExpenseServiceImplTest {

    @Mock
    private ExpenseRepository expenseRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private ExpenseMapper expenseMapper;
    @Mock
    private UserService userService;

    @InjectMocks
    private ExpenseServiceImpl expenseService;

    private User mockUser;
    private Expense mockExpense;
    private ExpenseDTO mockExpenseDTO;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setId(1L);

        mockExpense = new Expense();
        mockExpense.setId(100L);
        mockExpense.setAmount(new BigDecimal("50.00"));

        mockExpenseDTO = new ExpenseDTO(100L, new BigDecimal("50.00"), "Lunch", LocalDate.now(), null, null);
    }

    @Test
    void getExpenseById_Success() {
        when(userService.getCurrentUserEntity()).thenReturn(mockUser);
        when(expenseRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(mockExpense));
        when(expenseMapper.toDto(mockExpense)).thenReturn(mockExpenseDTO);

        ExpenseDTO result = expenseService.getExpenseById(100L);

        assertNotNull(result);
        assertEquals(new BigDecimal("50.00"), result.amount());
        verify(expenseRepository).findByIdAndUserId(100L, 1L);
    }

    @Test
    void createExpense_Success() {
        ExpenseRequest request = new ExpenseRequest(new BigDecimal("50.00"), "Lunch", LocalDate.now(), null, null);
        when(userService.getCurrentUserEntity()).thenReturn(mockUser);
        when(expenseMapper.toEntity(request)).thenReturn(mockExpense);
        when(expenseRepository.save(mockExpense)).thenReturn(mockExpense);
        when(expenseMapper.toDto(mockExpense)).thenReturn(mockExpenseDTO);

        ExpenseDTO result = expenseService.createExpense(request);

        assertNotNull(result);
        verify(expenseRepository).save(mockExpense);
    }
}
