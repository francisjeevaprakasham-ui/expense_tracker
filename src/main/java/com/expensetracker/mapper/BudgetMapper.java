package com.expensetracker.mapper;

import com.expensetracker.dto.BudgetDtos.BudgetDTO;
import com.expensetracker.dto.BudgetDtos.BudgetRequest;
import com.expensetracker.model.Budget;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {CategoryMapper.class})
public interface BudgetMapper {
    BudgetDTO toDto(Budget budget);

    @Mapping(target = "category", ignore = true)
    @Mapping(target = "user", ignore = true)
    Budget toEntity(BudgetRequest request);
}
