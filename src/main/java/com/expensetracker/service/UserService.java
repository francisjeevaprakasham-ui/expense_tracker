package com.expensetracker.service;

import com.expensetracker.dto.UserDTO;
import com.expensetracker.dto.UserRequestDtos.*;
import com.expensetracker.model.Role;
import com.expensetracker.model.User;

import java.util.List;

public interface UserService {
    UserDTO getCurrentUser();
    UserDTO updateProfile(UserProfileUpdateRequest request);
    void changePassword(PasswordUpdateRequest request);
    User getCurrentUserEntity();
    List<UserDTO> getAllUsers();
    UserDTO updateUserRole(Long userId, Role role);
}
