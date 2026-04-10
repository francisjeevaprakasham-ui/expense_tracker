package com.expensetracker.mapper;

import com.expensetracker.dto.ExpenseDtos.ExpenseDTO;
import com.expensetracker.dto.ExpenseDtos.ExpenseRequest;
import com.expensetracker.model.Expense;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Arrays;
import java.util.List;

@Mapper(componentModel = "spring", uses = {CategoryMapper.class})
public interface ExpenseMapper {

    @Mapping(target = "tags", expression = "java(expense.getTags() != null ? java.util.Arrays.asList(expense.getTags()) : null)")
    ExpenseDTO toDto(Expense expense);

    @Mapping(target = "category",  ignore = true)
    @Mapping(target = "user",      ignore = true)
    @Mapping(target = "id",        ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "tags", expression = "java(request.tags() != null ? request.tags().toArray(new String[0]) : null)")
    Expense toEntity(ExpenseRequest request);
}
