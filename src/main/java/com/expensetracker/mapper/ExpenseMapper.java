package com.expensetracker.mapper;

import com.expensetracker.dto.ExpenseDtos.ExpenseDTO;
import com.expensetracker.dto.ExpenseDtos.ExpenseRequest;
import com.expensetracker.model.Expense;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {CategoryMapper.class})
public interface ExpenseMapper {
    ExpenseDTO toDto(Expense expense);
    
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "user", ignore = true)
    Expense toEntity(ExpenseRequest request);
}
