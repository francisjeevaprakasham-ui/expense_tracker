package com.expensetracker.mapper;

import com.expensetracker.dto.UserDTO;
import com.expensetracker.model.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDTO toDto(User user);
}
