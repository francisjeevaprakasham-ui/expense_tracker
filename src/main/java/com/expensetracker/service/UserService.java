package com.expensetracker.service;

import com.expensetracker.dto.UserDTO;
import com.expensetracker.dto.UserRequestDtos.*;
import com.expensetracker.model.User;

public interface UserService {
    UserDTO getCurrentUser();
    UserDTO updateProfile(UserProfileUpdateRequest request);
    void changePassword(PasswordUpdateRequest request);
    User getCurrentUserEntity();
}
