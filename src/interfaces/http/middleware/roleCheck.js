/* eslint-disable no-console, no-magic-numbers */
/**
 * 角色检查中间件
 * 用于验证用户是否具有执行特定操作的权限
 */

import responseFormatter from './responseFormatter.js';

// 角色权限级别定义
const ROLE_LEVELS = {
  admin: 100,
  operator: 50,
  user: 10,
  guest: 1
};

// 角色权限映射
const ROLE_PERMISSIONS = {
  admin: [
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'device:create',
    'device:read',
    'device:update',
    'device:delete',
    'energy:create',
    'energy:read',
    'energy:update',
    'energy:delete',
    'carbon:create',
    'carbon:read',
    'carbon:update',
    'carbon:delete',
    'maintenance:create',
    'maintenance:read',
    'maintenance:update',
    'maintenance:delete',
    'digitaltwin:create',
    'digitaltwin:read',
    'digitaltwin:update',
    'digitaltwin:delete',
    'system:config',
    'system:backup',
    'system:restore',
    'report:generate',
    'report:export'
  ],
  operator: [
    'device:create',
    'device:read',
    'device:update',
    'energy:create',
    'energy:read',
    'energy:update',
    'carbon:create',
    'carbon:read',
    'carbon:update',
    'maintenance:create',
    'maintenance:read',
    'maintenance:update',
    'digitaltwin:create',
    'digitaltwin:read',
    'digitaltwin:update',
    'report:generate',
    'report:export'
  ],
  user: [
    'device:read',
    'energy:read',
    'carbon:read',
    'maintenance:read',
    'digitaltwin:read',
    'report:generate'
  ],
  guest: ['device:read', 'energy:read', 'carbon:read']
};

/**
 * 检查用户是否具有指定角色
 * @param {Array|string} allowedRoles - 允许的角色列表
 * @returns {Function} Express中间件函数
 */
function requireRole(allowedRoles) {
  // 确保allowedRoles是数组
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    try {
      // 检查用户是否已认证
      if (!req.user) {
        return responseFormatter.unauthorized(res, '用户未认证');
      }

      const userRole = req.user.role;

      // 检查用户角色是否在允许的角色列表中
      if (!roles.includes(userRole)) {
        return responseFormatter.forbidden(res, `需要以下角色之一: ${roles.join(', ')}`);
      }

      // 记录权限检查日志
      console.log(
        `[${new Date().toISOString()}] Role Check: User ${req.user.username} (${userRole}) accessing ${req.method} ${req.path}`
      );

      next();
    } catch (error) {
      console.error('角色检查错误:', error);
      return responseFormatter.internalError(res, '权限验证失败', error);
    }
  };
}

/**
 * 检查用户是否具有指定权限
 * @param {Array|string} requiredPermissions - 需要的权限列表
 * @returns {Function} Express中间件函数
 */
function requirePermission(requiredPermissions) {
  // 确保requiredPermissions是数组
  const permissions = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  return (req, res, next) => {
    try {
      // 检查用户是否已认证
      if (!req.user) {
        return responseFormatter.unauthorized(res, '用户未认证');
      }

      const userRole = req.user.role;
      const userPermissions = ROLE_PERMISSIONS[userRole] || [];

      // 检查用户是否具有所有需要的权限
      const hasAllPermissions = permissions.every((permission) =>
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        const missingPermissions = permissions.filter(
          (permission) => !userPermissions.includes(permission)
        );

        return responseFormatter.forbidden(res, `缺少权限: ${missingPermissions.join(', ')}`);
      }

      // 记录权限检查日志
      console.log(
        `[${new Date().toISOString()}] Permission Check: User ${req.user.username} (${userRole}) has permissions: ${permissions.join(', ')}`
      );

      next();
    } catch (error) {
      console.error('权限检查错误:', error);
      return responseFormatter.internalError(res, '权限验证失败', error);
    }
  };
}

/**
 * 检查用户是否具有足够的角色级别
 * @param {string} minimumRole - 最低要求的角色
 * @returns {Function} Express中间件函数
 */
function requireMinimumRole(minimumRole) {
  return (req, res, next) => {
    try {
      // 检查用户是否已认证
      if (!req.user) {
        return responseFormatter.unauthorized(res, '用户未认证');
      }

      const userRole = req.user.role;
      const userLevel = ROLE_LEVELS[userRole] || 0;
      const requiredLevel = ROLE_LEVELS[minimumRole] || 0;

      if (userLevel < requiredLevel) {
        return responseFormatter.forbidden(res, `需要至少 ${minimumRole} 角色权限`);
      }

      // 记录权限检查日志
      console.log(
        `[${new Date().toISOString()}] Role Level Check: User ${req.user.username} (${userRole}:${userLevel}) meets minimum requirement (${minimumRole}:${requiredLevel})`
      );

      next();
    } catch (error) {
      console.error('角色级别检查错误:', error);
      return responseFormatter.internalError(res, '权限验证失败', error);
    }
  };
}

/**
 * 检查用户是否为资源所有者或具有管理权限
 * @param {Function} getResourceOwnerId - 获取资源所有者ID的函数
 * @returns {Function} Express中间件函数
 */
function requireOwnershipOrAdmin(getResourceOwnerId) {
  return async (req, res, next) => {
    try {
      // 检查用户是否已认证
      if (!req.user) {
        return responseFormatter.unauthorized(res, '用户未认证');
      }

      const userRole = req.user.role;
      const {userId} = req.user;

      // 管理员可以访问所有资源
      if (userRole === 'admin') {
        return next();
      }

      // 获取资源所有者ID
      const resourceOwnerId = await getResourceOwnerId(req);

      // 检查用户是否为资源所有者
      if (userId !== resourceOwnerId) {
        return responseFormatter.forbidden(res, '只能访问自己的资源');
      }

      // 记录权限检查日志
      console.log(
        `[${new Date().toISOString()}] Ownership Check: User ${req.user.username} accessing own resource`
      );

      next();
    } catch (error) {
      console.error('所有权检查错误:', error);
      return responseFormatter.internalError(res, '权限验证失败', error);
    }
  };
}

/**
 * 条件权限检查
 * @param {Function} condition - 条件检查函数
 * @param {Array|string} allowedRoles - 满足条件时允许的角色
 * @param {Array|string} fallbackRoles - 不满足条件时允许的角色
 * @returns {Function} Express中间件函数
 */
function conditionalRole(condition, allowedRoles, fallbackRoles = []) {
  return async (req, res, next) => {
    try {
      // 检查用户是否已认证
      if (!req.user) {
        return responseFormatter.unauthorized(res, '用户未认证');
      }

      const userRole = req.user.role;
      const conditionMet = await condition(req);

      const targetRoles = conditionMet
        ? Array.isArray(allowedRoles)
          ? allowedRoles
          : [allowedRoles]
        : Array.isArray(fallbackRoles)
          ? fallbackRoles
          : [fallbackRoles];

      if (!targetRoles.includes(userRole)) {
        return responseFormatter.forbidden(
          res,
          `当前条件下需要以下角色之一: ${targetRoles.join(', ')}`
        );
      }

      // 记录权限检查日志
      console.log(
        `[${new Date().toISOString()}] Conditional Role Check: User ${req.user.username} (${userRole}) - condition: ${conditionMet}`
      );

      next();
    } catch (error) {
      console.error('条件权限检查错误:', error);
      return responseFormatter.internalError(res, '权限验证失败', error);
    }
  };
}

/**
 * 获取用户权限列表
 * @param {string} role - 用户角色
 * @returns {Array} 权限列表
 */
function getUserPermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * 检查角色是否具有指定权限
 * @param {string} role - 角色
 * @param {string} permission - 权限
 * @returns {boolean} 是否具有权限
 */
function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * 获取角色级别
 * @param {string} role - 角色
 * @returns {number} 角色级别
 */
function getRoleLevel(role) {
  return ROLE_LEVELS[role] || 0;
}

/**
 * 比较两个角色的级别
 * @param {string} role1 - 角色1
 * @param {string} role2 - 角色2
 * @returns {number} 比较结果 (1: role1 > role2, 0: 相等, -1: role1 < role2)
 */
function compareRoles(role1, role2) {
  const level1 = getRoleLevel(role1);
  const level2 = getRoleLevel(role2);

  if (level1 > level2) {return 1;}
  if (level1 < level2) {return -1;}
  return 0;
}

/**
 * 权限检查中间件工厂
 * 根据HTTP方法自动选择权限检查策略
 * @param {string} resource - 资源名称
 * @returns {Function} Express中间件函数
 */
function autoPermissionCheck(resource) {
  return (req, res, next) => {
    const method = req.method.toLowerCase();
    let requiredPermission;

    switch (method) {
      case 'get':
        requiredPermission = `${resource}:read`;
        break;
      case 'post':
        requiredPermission = `${resource}:create`;
        break;
      case 'put':
      case 'patch':
        requiredPermission = `${resource}:update`;
        break;
      case 'delete':
        requiredPermission = `${resource}:delete`;
        break;
      default:
        return responseFormatter.error(res, '不支持的HTTP方法', 405);
    }

    return requirePermission(requiredPermission)(req, res, next);
  };
}

export {
  requireRole,
  requirePermission,
  requireMinimumRole,
  requireOwnershipOrAdmin,
  conditionalRole,
  autoPermissionCheck,
  getUserPermissions,
  hasPermission,
  getRoleLevel,
  compareRoles,
  ROLE_LEVELS,
  ROLE_PERMISSIONS
};

export default requireRole;
