package com.zerocarbon.security.repository;

import com.zerocarbon.security.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 用户数据访问层
 * 零碳园区数字孪生系统用户管理
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    /**
     * 根据用户名查找用户
     */
    Optional<User> findByUsername(String username);
    
    /**
     * 根据邮箱查找用户
     */
    Optional<User> findByEmail(String email);
    
    /**
     * 根据手机号查找用户
     */
    Optional<User> findByPhone(String phone);
    
    /**
     * 检查用户名是否存在
     */
    boolean existsByUsername(String username);
    
    /**
     * 检查邮箱是否存在
     */
    boolean existsByEmail(String email);
    
    /**
     * 检查手机号是否存在
     */
    boolean existsByPhone(String phone);
    
    /**
     * 根据状态查找用户
     */
    List<User> findByStatus(User.UserStatus status);
    
    /**
     * 根据部门查找用户
     */
    List<User> findByDepartment(String department);
    
    /**
     * 查找启用的用户
     */
    List<User> findByEnabledTrue();
    
    /**
     * 查找禁用的用户
     */
    List<User> findByEnabledFalse();
    
    /**
     * 查找锁定的用户
     */
    @Query("SELECT u FROM User u WHERE u.accountNonLocked = false OR u.lockedTime > :unlockTime")
    List<User> findLockedUsers(@Param("unlockTime") LocalDateTime unlockTime);
    
    /**
     * 查找需要修改密码的用户
     */
    @Query("SELECT u FROM User u WHERE u.passwordLastModified IS NULL OR u.passwordLastModified < :expireTime")
    List<User> findUsersNeedPasswordChange(@Param("expireTime") LocalDateTime expireTime);
    
    /**
     * 查找密码修改时间早于指定时间的用户
     */
    @Query("SELECT u FROM User u WHERE u.passwordLastModified IS NULL OR u.passwordLastModified < :threshold")
    List<User> findUsersWithPasswordModifiedBefore(@Param("threshold") LocalDateTime threshold);
    
    /**
     * 查找锁定时间早于指定时间的用户
     */
    @Query("SELECT u FROM User u WHERE u.accountNonLocked = false AND u.lockedTime < :unlockTime")
    List<User> findLockedUsersBeforeTime(@Param("unlockTime") LocalDateTime unlockTime);
    
    /**
     * 查找长时间未登录的用户
     */
    @Query("SELECT u FROM User u WHERE u.lastLoginTime IS NULL OR u.lastLoginTime < :inactiveTime")
    List<User> findInactiveUsers(@Param("inactiveTime") LocalDateTime inactiveTime);
    
    /**
     * 根据角色查找用户
     */
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.code = :roleCode")
    List<User> findByRoleCode(@Param("roleCode") String roleCode);
    
    /**
     * 根据权限查找用户
     */
    @Query("SELECT DISTINCT u FROM User u JOIN u.roles r JOIN r.permissions p WHERE p.code = :permissionCode")
    List<User> findByPermissionCode(@Param("permissionCode") String permissionCode);
    
    /**
     * 更新用户最后登录信息
     */
    @Modifying
    @Query("UPDATE User u SET u.lastLoginTime = :loginTime, u.lastLoginIp = :loginIp WHERE u.id = :userId")
    void updateLastLoginInfo(@Param("userId") Long userId, 
                           @Param("loginTime") LocalDateTime loginTime, 
                           @Param("loginIp") String loginIp);
    
    /**
     * 更新用户登录失败次数
     */
    @Modifying
    @Query("UPDATE User u SET u.loginFailureCount = :attempts WHERE u.id = :userId")
    void updateLoginFailureCount(@Param("userId") Long userId, @Param("attempts") Integer attempts);
    
    /**
     * 锁定用户账户
     */
    @Modifying
    @Query("UPDATE User u SET u.accountNonLocked = false, u.lockedTime = :lockedTime WHERE u.id = :userId")
    void lockUser(@Param("userId") Long userId, @Param("lockedTime") LocalDateTime lockedTime);
    
    /**
     * 解锁用户账户
     */
    @Modifying
    @Query("UPDATE User u SET u.accountNonLocked = true, u.lockedTime = null, u.loginFailureCount = 0 WHERE u.id = :userId")
    void unlockUser(@Param("userId") Long userId);
    
    /**
     * 更新用户密码
     */
    @Modifying
    @Query("UPDATE User u SET u.password = :password, u.passwordLastModified = :modifiedTime WHERE u.id = :userId")
    void updatePassword(@Param("userId") Long userId, 
                       @Param("password") String password, 
                       @Param("modifiedTime") LocalDateTime modifiedTime);
    
    /**
     * 启用/禁用用户
     */
    @Modifying
    @Query("UPDATE User u SET u.enabled = :enabled WHERE u.id = :userId")
    void updateUserStatus(@Param("userId") Long userId, @Param("enabled") Boolean enabled);
    
    /**
     * 批量启用用户
     */
    @Modifying
    @Query("UPDATE User u SET u.enabled = true WHERE u.id IN :userIds")
    void enableUsers(@Param("userIds") List<Long> userIds);
    
    /**
     * 批量禁用用户
     */
    @Modifying
    @Query("UPDATE User u SET u.enabled = false WHERE u.id IN :userIds")
    void disableUsers(@Param("userIds") List<Long> userIds);
    
    /**
     * 根据创建时间范围查找用户
     */
    List<User> findByCreatedTimeBetween(LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * 统计用户数量
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.enabled = true")
    Long countActiveUsers();
    
    /**
     * 统计各状态用户数量
     */
    @Query("SELECT u.status, COUNT(u) FROM User u GROUP BY u.status")
    List<Object[]> countUsersByStatus();
    
    /**
     * 统计各部门用户数量
     */
    @Query("SELECT u.department, COUNT(u) FROM User u WHERE u.department IS NOT NULL GROUP BY u.department")
    List<Object[]> countUsersByDepartment();
    
    /**
     * 模糊查询用户
     */
    @Query("SELECT u FROM User u WHERE u.username LIKE %:keyword% OR u.realName LIKE %:keyword% OR u.email LIKE %:keyword%")
    List<User> searchUsers(@Param("keyword") String keyword);
    
    /**
     * 查找即将过期的用户
     */
    @Query("SELECT u FROM User u WHERE u.accountNonExpired = true AND u.createdTime < :expireTime")
    List<User> findUsersNearExpiry(@Param("expireTime") LocalDateTime expireTime);
    
    /**
     * 自动解锁过期锁定的用户
     */
    @Modifying
    @Query("UPDATE User u SET u.accountNonLocked = true, u.lockedTime = null WHERE u.lockedTime < :unlockTime")
    void autoUnlockExpiredUsers(@Param("unlockTime") LocalDateTime unlockTime);
}