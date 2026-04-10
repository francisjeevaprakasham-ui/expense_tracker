package com.expensetracker.service;

import com.expensetracker.dto.UserDTO;
import com.expensetracker.dto.UserRequestDtos.*;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.exception.UnauthorizedException;
import com.expensetracker.mapper.UserMapper;
import com.expensetracker.model.Role;
import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User getCurrentUserEntity() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }
        return userRepository.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Override
    public UserDTO getCurrentUser() {
        return userMapper.toDto(getCurrentUserEntity());
    }

    @Override
    public UserDTO updateProfile(UserProfileUpdateRequest request) {
        User user = getCurrentUserEntity();
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        return userMapper.toDto(userRepository.save(user));
    }

    @Override
    public void changePassword(PasswordUpdateRequest request) {
        User user = getCurrentUserEntity();
        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid old password");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Override
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public UserDTO updateUserRole(Long userId, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setRole(role);
        return userMapper.toDto(userRepository.save(user));
    }
}
