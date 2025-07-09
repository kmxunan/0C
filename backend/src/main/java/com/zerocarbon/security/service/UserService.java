package com.zerocarbon.security.service;

import com.zerocarbon.security.entity.User;
import com.zerocarbon.security.entity.Role;
import com.zerocarbon.security.entity.UserLoginLog;
import com.zerocarbon.security.repository.UserRepository;
import com.zerocarbon.security.repository.RoleRepository;
import com.zerocarbon.security.repository.UserLoginLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 用户服务类
 * 零碳园区数字孪生系统用户管理
 */
@Service
@Transactional
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private UserLoginLogRepository loginLogRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    // 密码策略配置
    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final int ACCOUNT_LOCK_DURATION_HOURS = 24;
    private static final int PASSWORD_EXPIRY_DAYS = 90;
    
    /**
     * 创建用户
     */
    public User createUser(User user) {
        validateUserForCreation(user);
        
        // 加密密码
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // 设置默认值
        user.setEnabled(true);
        user.setAccountNonExpired(true);
        user.setAccountNonLocked(true);
        user.setCredentialsNonExpired(true);
        user.setLoginFailureCount(0);
        user.setStatus(User.UserStatus.ACTIVE);
        
        // 分配默认角色
        assignDefaultRoles(user);
        
        return userRepository.save(user);
    }
    
    /**
     * 更新用户信息
     */
    public User updateUser(Long userId, User userDetails) {
        User existingUser = getUserById(userId);
        
        // 更新基本信息
        if (StringUtils.hasText(userDetails.getEmail())) {
            validateEmailUniqueness(userDetails.getEmail(), userId);
            existingUser.setEmail(userDetails.getEmail());
        }
        
        if (StringUtils.hasText(userDetails.getPhone())) {
            validatePhoneUniqueness(userDetails.getPhone(), userId);
            existingUser.setPhone(userDetails.getPhone());
        }
        
        if (StringUtils.hasText(userDetails.getRealName())) {
            existingUser.setRealName(userDetails.getRealName());
        }
        
        if (StringUtils.hasText(userDetails.getDepartment())) {
            existingUser.setDepartment(userDetails.getDepartment());
        }
        
        if (StringUtils.hasText(userDetails.getPosition())) {
            existingUser.setPosition(userDetails.getPosition());
        }
        
        return userRepository.save(existingUser);
    }
    
    /**
     * 修改密码
     */
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = getUserById(userId);
        
        // 验证旧密码
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("旧密码不正确");
        }
        
        // 验证新密码
        validatePassword(newPassword);
        
        // 更新密码
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordLastModified(LocalDateTime.now());
        user.setCredentialsNonExpired(true);
        
        userRepository.save(user);
    }
    
    /**
     * 重置密码
     */
    public String resetPassword(Long userId) {
        User user = getUserById(userId);
        
        // 生成临时密码
        String tempPassword = generateTempPassword();
        
        // 更新密码
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setPasswordLastModified(LocalDateTime.now());
        user.setCredentialsNonExpired(false); // 强制下次登录修改密码
        
        userRepository.save(user);
        
        return tempPassword;
    }
    
    /**
     * 启用用户
     */
    public void enableUser(Long userId) {
        User user = getUserById(userId);
        user.setEnabled(true);
        user.setStatus(User.UserStatus.ACTIVE);
        userRepository.save(user);
    }
    
    /**
     * 禁用用户
     */
    public void disableUser(Long userId) {
        User user = getUserById(userId);
        user.setEnabled(false);
        user.setStatus(User.UserStatus.INACTIVE);
        userRepository.save(user);
    }
    
    /**
     * 锁定用户
     */
    public void lockUser(Long userId, String reason) {
        User user = getUserById(userId);
        user.setAccountNonLocked(false);
        user.setLockedTime(LocalDateTime.now());
        user.setStatus(User.UserStatus.LOCKED);
        userRepository.save(user);
    }
    
    /**
     * 解锁用户
     */
    public void unlockUser(Long userId) {
        User user = getUserById(userId);
        user.setAccountNonLocked(true);
        user.setLockedTime(null);
        user.setLoginFailureCount(0);
        user.setStatus(User.UserStatus.ACTIVE);
        userRepository.save(user);
    }
    
    /**
     * 删除用户
     */
    public void deleteUser(Long userId) {
        User user = getUserById(userId);
        user.setStatus(User.UserStatus.DELETED);
        user.setEnabled(false);
        userRepository.save(user);
    }
    
    /**
     * 分配角色
     */
    public void assignRoles(Long userId, List<Long> roleIds) {
        User user = getUserById(userId);
        Set<Role> roles = new HashSet<>();
        
        for (Long roleId : roleIds) {
            Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("角色不存在: " + roleId));
            roles.add(role);
        }
        
        user.setRoles(roles);
        userRepository.save(user);
    }
    
    /**
     * 移除角色
     */
    public void removeRoles(Long userId, List<Long> roleIds) {
        User user = getUserById(userId);
        Set<Role> currentRoles = user.getRoles();
        
        for (Long roleId : roleIds) {
            currentRoles.removeIf(role -> role.getId().equals(roleId));
        }
        
        user.setRoles(currentRoles);
        userRepository.save(user);
    }
    
    /**
     * 记录登录成功
     */
    public void recordLoginSuccess(String username, String ipAddress, String userAgent) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + username));
        
        // 更新用户登录信息
        user.setLastLoginTime(LocalDateTime.now());
        user.setLastLoginIp(ipAddress);
        user.setLoginFailureCount(0);
        userRepository.save(user);
        
        // 记录登录日志
        UserLoginLog loginLog = new UserLoginLog();
        loginLog.setUserId(user.getId());
        loginLog.setUsername(username);
        loginLog.setLoginType(UserLoginLog.LoginType.WEB);
        loginLog.setStatus(UserLoginLog.LoginStatus.SUCCESS);
        loginLog.setIpAddress(ipAddress);
        loginLog.setUserAgent(userAgent);
        loginLog.setSessionId(UUID.randomUUID().toString());
        
        loginLogRepository.save(loginLog);
    }
    
    /**
     * 记录登录失败
     */
    public void recordLoginFailure(String username, String ipAddress, String userAgent, String failureReason) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // 增加失败次数
        user.setLoginFailureCount(user.getLoginFailureCount() + 1);
            
            // 检查是否需要锁定账户
            if (user.getLoginFailureCount() >= MAX_LOGIN_ATTEMPTS) {
                user.setAccountNonLocked(false);
                user.setLockedTime(LocalDateTime.now());
                user.setStatus(User.UserStatus.LOCKED);
            }
            
            userRepository.save(user);
        }
        
        // 记录登录日志
        UserLoginLog loginLog = new UserLoginLog();
        if (userOpt.isPresent()) {
            loginLog.setUserId(userOpt.get().getId());
        }
        loginLog.setUsername(username);
        loginLog.setLoginType(UserLoginLog.LoginType.WEB);
        loginLog.setStatus(UserLoginLog.LoginStatus.FAILED);
        loginLog.setIpAddress(ipAddress);
        loginLog.setUserAgent(userAgent);
        loginLog.setFailureReason(failureReason);
        
        loginLogRepository.save(loginLog);
    }
    
    /**
     * 查询用户
     */
    @Transactional(readOnly = true)
    public User getUserById(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + userId));
    }
    
    @Transactional(readOnly = true)
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + username));
    }
    
    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public List<User> getActiveUsers() {
        return userRepository.findByEnabledTrue();
    }
    
    @Transactional(readOnly = true)
    public List<User> getUsersByDepartment(String department) {
        return userRepository.findByDepartment(department);
    }
    
    @Transactional(readOnly = true)
    public List<User> getUsersByRole(String roleCode) {
        return userRepository.findByRoleCode(roleCode);
    }
    
    @Transactional(readOnly = true)
    public List<User> searchUsers(String keyword) {
        return userRepository.searchUsers(keyword);
    }
    
    /**
     * 检查密码是否即将过期
     */
    @Transactional(readOnly = true)
    public List<User> getUsersWithExpiringPasswords(int daysBeforeExpiry) {
        LocalDateTime threshold = LocalDateTime.now().minusDays(PASSWORD_EXPIRY_DAYS - daysBeforeExpiry);
        return userRepository.findUsersWithPasswordModifiedBefore(threshold);
    }
    
    /**
     * 自动解锁过期的锁定账户
     */
    public void unlockExpiredAccounts() {
        LocalDateTime unlockThreshold = LocalDateTime.now().minusHours(ACCOUNT_LOCK_DURATION_HOURS);
        List<User> lockedUsers = userRepository.findLockedUsersBeforeTime(unlockThreshold);
        
        for (User user : lockedUsers) {
            unlockUser(user.getId());
        }
    }
    
    // 私有辅助方法
    
    private void validateUserForCreation(User user) {
        if (!StringUtils.hasText(user.getUsername())) {
            throw new IllegalArgumentException("用户名不能为空");
        }
        
        if (!StringUtils.hasText(user.getPassword())) {
            throw new IllegalArgumentException("密码不能为空");
        }
        
        if (!StringUtils.hasText(user.getEmail())) {
            throw new IllegalArgumentException("邮箱不能为空");
        }
        
        validateUsernameUniqueness(user.getUsername());
        validateEmailUniqueness(user.getEmail(), null);
        validatePassword(user.getPassword());
        
        if (StringUtils.hasText(user.getPhone())) {
            validatePhoneUniqueness(user.getPhone(), null);
        }
    }
    
    private void validateUsernameUniqueness(String username) {
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("用户名已存在: " + username);
        }
    }
    
    private void validateEmailUniqueness(String email, Long excludeUserId) {
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent() && !existingUser.get().getId().equals(excludeUserId)) {
            throw new IllegalArgumentException("邮箱已存在: " + email);
        }
    }
    
    private void validatePhoneUniqueness(String phone, Long excludeUserId) {
        Optional<User> existingUser = userRepository.findByPhone(phone);
        if (existingUser.isPresent() && !existingUser.get().getId().equals(excludeUserId)) {
            throw new IllegalArgumentException("手机号已存在: " + phone);
        }
    }
    
    private void validatePassword(String password) {
        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalArgumentException("密码长度不能少于" + MIN_PASSWORD_LENGTH + "位");
        }
        
        // 密码复杂度检查
        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = password.chars().anyMatch(ch -> "!@#$%^&*()_+-=[]{}|;:,.<>?".indexOf(ch) >= 0);
        
        int complexityCount = (hasUpper ? 1 : 0) + (hasLower ? 1 : 0) + (hasDigit ? 1 : 0) + (hasSpecial ? 1 : 0);
        
        if (complexityCount < 3) {
            throw new IllegalArgumentException("密码必须包含大写字母、小写字母、数字、特殊字符中的至少3种");
        }
    }
    
    private void assignDefaultRoles(User user) {
        List<Role> defaultRoles = roleRepository.findByIsDefaultTrue();
        if (!defaultRoles.isEmpty()) {
            user.setRoles(new HashSet<>(defaultRoles));
        }
    }
    
    private String generateTempPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        Random random = new Random();
        StringBuilder password = new StringBuilder();
        
        for (int i = 0; i < 12; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        return password.toString();
    }
}