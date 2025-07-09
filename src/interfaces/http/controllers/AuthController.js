import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import BaseController from './BaseController.js';
import User from '../../../core/entities/User.js';
import config from '../../../shared/config/index.js';
import logger from '../../../shared/utils/logger.js';
import { defaultJWTManager } from '../../../core/services/jwtManager.js';
/* eslint-disable no-magic-numbers */

/**
 * 认证控制器
 * 处理用户认证相关的业务逻辑
 */
class AuthController extends BaseController {
  constructor() {
    super();
    this.saltRounds = 12;
    this.jwtManager = defaultJWTManager;
  }

  /**
   * 用户登录
   */
  login = this.asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.validationError(errors.array());
    }

    const { username, password } = req.body;

    try {
      // 查找用户
      const user = await User.findByUsername(username);
      if (!user) {
        this.logOperation(req, 'LOGIN_FAILED', { username, reason: 'USER_NOT_FOUND' });
        return res.unauthorized('用户名或密码错误');
      }

      // 验证密码
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        this.logOperation(req, 'LOGIN_FAILED', { username, reason: 'INVALID_PASSWORD' });
        return res.unauthorized('用户名或密码错误');
      }

      // 检查用户状态
      if (user.status !== 'active') {
        this.logOperation(req, 'LOGIN_FAILED', { username, reason: 'USER_INACTIVE' });
        return res.forbidden('用户账户已被禁用');
      }

      // 生成JWT令牌
      const tokenPayload = {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions || []
      };

      const accessToken = this.jwtManager.generateToken(tokenPayload);
      const refreshToken = this.jwtManager.generateRefreshToken(tokenPayload);

      // 更新最后登录时间
      await User.updateLastLogin(user.id);

      // 清理敏感数据
      const userResponse = this.sanitizeUser(user);

      this.logOperation(req, 'LOGIN_SUCCESS', { userId: user.id, username });

      res.success(
        {
          user: userResponse,
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: config.jwt.expiresIn
          }
        },
        '登录成功'
      );
    } catch (error) {
      logger.error('登录失败', {
        error: error.message,
        username,
        ip: req.ip
      });
      res.internalError('登录失败，请稍后重试');
    }
  });

  /**
   * 用户注册
   */
  register = this.asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.validationError(errors.array());
    }

    const { username, password, email, role = 'viewer' } = req.body;

    try {
      // 检查用户名是否已存在
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.conflict('用户名已存在');
      }

      // 检查邮箱是否已存在
      if (email) {
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
          return res.conflict('邮箱已被使用');
        }
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, this.saltRounds);

      // 创建用户
      const userData = {
        username,
        password: hashedPassword,
        email,
        role,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      const newUser = await User.create(userData);
      const userResponse = this.sanitizeUser(newUser);

      this.logOperation(req, 'USER_REGISTER', { userId: newUser.id, username });

      res.success(userResponse, '注册成功', 201);
    } catch (error) {
      logger.error('注册失败', {
        error: error.message,
        username,
        email,
        ip: req.ip
      });
      res.internalError('注册失败，请稍后重试');
    }
  });

  /**
   * 获取当前用户信息
   */
  getCurrentUser = this.asyncHandler(async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.notFound('用户不存在');
      }

      const userResponse = this.sanitizeUser(user);
      res.success(userResponse);
    } catch (error) {
      logger.error('获取用户信息失败', {
        error: error.message,
        userId: req.user?.id
      });
      res.internalError('获取用户信息失败');
    }
  });

  /**
   * 更新用户信息
   */
  updateProfile = this.asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.validationError(errors.array());
    }

    const { email, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.notFound('用户不存在');
      }

      const updateData = {};

      // 更新邮箱
      if (email && email !== user.email) {
        const existingEmail = await User.findByEmail(email);
        if (existingEmail && existingEmail.id !== userId) {
          return res.conflict('邮箱已被使用');
        }
        updateData.email = email;
      }

      // 更新密码
      if (newPassword) {
        if (!currentPassword) {
          return res.badRequest('更新密码需要提供当前密码');
        }

        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
          return res.unauthorized('当前密码错误');
        }

        updateData.password = await bcrypt.hash(newPassword, this.saltRounds);
      }

      if (Object.keys(updateData).length === 0) {
        return res.badRequest('没有需要更新的数据');
      }

      updateData.updatedAt = new Date().toISOString();
      const updatedUser = await User.update(userId, updateData);
      const userResponse = this.sanitizeUser(updatedUser);

      this.logOperation(req, 'PROFILE_UPDATE', { userId, fields: Object.keys(updateData) });

      res.success(userResponse, '用户信息更新成功');
    } catch (error) {
      logger.error('更新用户信息失败', {
        error: error.message,
        userId
      });
      res.internalError('更新用户信息失败');
    }
  });

  /**
   * 用户登出
   */
  logout = this.asyncHandler(async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        // 将令牌加入黑名单
        await this.jwtManager.blacklistToken(token);
      }

      this.logOperation(req, 'LOGOUT', { userId: req.user?.id });

      res.success(null, '登出成功');
    } catch (error) {
      logger.error('登出失败', {
        error: error.message,
        userId: req.user?.id
      });
      res.internalError('登出失败');
    }
  });

  /**
   * 刷新访问令牌
   */
  refreshToken = this.asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.badRequest('缺少刷新令牌');
    }

    try {
      // 验证刷新令牌
      const decoded = this.jwtManager.verifyRefreshToken(refreshToken);

      // 检查用户是否仍然存在且活跃
      const user = await User.findById(decoded.id);
      if (!user || user.status !== 'active') {
        return res.unauthorized('用户不存在或已被禁用');
      }

      // 生成新的访问令牌
      const tokenPayload = {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions || []
      };

      const newAccessToken = this.jwtManager.generateToken(tokenPayload);
      const newRefreshToken = this.jwtManager.generateRefreshToken(tokenPayload);

      // 将旧的刷新令牌加入黑名单
      await this.jwtManager.blacklistToken(refreshToken);

      res.success(
        {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: config.jwt.expiresIn
        },
        '令牌刷新成功'
      );
    } catch (error) {
      logger.error('刷新令牌失败', {
        error: error.message,
        ip: req.ip
      });

      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.unauthorized('无效的刷新令牌');
      }

      res.internalError('令牌刷新失败');
    }
  });

  /**
   * 清理用户敏感数据
   */
  sanitizeUser(user) {
    const { password: _password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  /**
   * 验证用户权限
   */
  checkPermission = this.asyncHandler(async (req, res) => {
    const { permission } = req.params;
    const userPermissions = req.user.permissions || [];
    const hasPermission = userPermissions.includes(permission) || req.user.role === 'admin';

    res.success({ hasPermission }, '权限检查完成');
  });
}

export default new AuthController();
