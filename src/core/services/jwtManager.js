/* eslint-disable no-console, no-magic-numbers */
/**
 * JWT认证管理器
 * 提供安全的JWT token生成、验证和刷新机制
 */

import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import crypto from 'crypto';
import { AuthenticationError, AuthorizationError as _AuthorizationError } from '../../shared/utils/AppError.js';
import config from '../../shared/config/index.js';

/**
 * JWT管理器类
 */
export class JWTManager {
  constructor(options = {}) {
    this.secret = options.secret || config.jwt.secret;
    this.accessTokenExpiry = options.accessTokenExpiry || config.jwt.accessTokenExpiry;
    this.refreshTokenExpiry = options.refreshTokenExpiry || config.jwt.refreshTokenExpiry;
    this.issuer = options.issuer || config.jwt.issuer;
    this.audience = options.audience || config.jwt.audience;

    // 用于存储已撤销的token（在生产环境中应使用Redis）
    this.revokedTokens = new Set();

    // 用于存储刷新token（在生产环境中应使用数据库）
    this.refreshTokenStore = new Map();

    // 定期清理过期的撤销token
    this.startCleanupInterval();
  }

  /**
   * 生成访问token和刷新token
   * @param {Object} payload - token载荷
   * @param {Object} options - 额外选项
   * @returns {Object} 包含accessToken和refreshToken的对象
   */

  // TODO: 考虑将此函数拆分为更小的函数 (当前 53 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 53 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 53 行)

  // TODO: 考虑将此函数拆分为更小的函数 (当前 53 行)

  generateTokens(payload, options = {}) {
    const tokenId = crypto.randomUUID();
    const refreshTokenId = crypto.randomUUID();

    const accessTokenPayload = {
      ...payload,
      jti: tokenId, // JWT ID
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    };

    const refreshTokenPayload = {
      userId: payload.userId,
      username: payload.username,
      jti: refreshTokenId,
      type: 'refresh',
      accessTokenId: tokenId,
      iat: Math.floor(Date.now() / 1000)
    };

    const accessToken = jwt.sign(accessTokenPayload, this.secret, {
      expiresIn: this.accessTokenExpiry,
      issuer: this.issuer,
      audience: this.audience,
      algorithm: 'HS256'
    });

    const refreshToken = jwt.sign(refreshTokenPayload, this.secret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: this.issuer,
      audience: this.audience,
      algorithm: 'HS256'
    });

    // 存储刷新token信息
    this.refreshTokenStore.set(refreshTokenId, {
      userId: payload.userId,
      accessTokenId: tokenId,
      createdAt: new Date(),
      lastUsed: new Date(),
      userAgent: options.userAgent,
      ipAddress: options.ipAddress
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.parseExpiry(this.accessTokenExpiry),
      tokenId,
      refreshTokenId
    };
  }

  /**
   * 验证token
   * @param {string} token - 要验证的token
   * @param {string} expectedType - 期望的token类型（access或refresh）
   * @returns {Object} 解码后的token载荷
   */
  async verifyToken(token, expectedType = 'access') {
    try {
      const decoded = await promisify(jwt.verify)(token, this.secret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256']
      });

      // 检查token类型
      if (decoded.type !== expectedType) {
        throw new AuthenticationError(
          `无效的token类型，期望: ${expectedType}，实际: ${decoded.type}`
        );
      }

      // 检查token是否已被撤销
      if (this.revokedTokens.has(decoded.jti)) {
        throw new AuthenticationError('Token已被撤销');
      }

      // 如果是刷新token，检查是否存在于存储中
      if (expectedType === 'refresh' && !this.refreshTokenStore.has(decoded.jti)) {
        throw new AuthenticationError('刷新token无效或已过期');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token已过期');
      } else if (error.name === 'JsonWebTokenError') {
        throw new AuthenticationError('无效的token格式');
      } else if (error.name === 'NotBeforeError') {
        throw new AuthenticationError('Token尚未生效');
      } else if (error instanceof AuthenticationError) {
        throw error;
      } else {
        throw new AuthenticationError('Token验证失败');
      }
    }
  }

  /**
   * 刷新访问token
   * @param {string} refreshToken - 刷新token
   * @param {Object} options - 额外选项
   * @returns {Object} 新的token对
   */
  async refreshAccessToken(refreshToken, options = {}) {
    // 验证刷新token
    const decoded = await this.verifyToken(refreshToken, 'refresh');

    // 获取刷新token信息
    const refreshTokenInfo = this.refreshTokenStore.get(decoded.jti);
    if (!refreshTokenInfo) {
      throw new AuthenticationError('刷新token信息不存在');
    }

    // 撤销旧的访问token
    this.revokedTokens.add(decoded.accessTokenId);

    // 更新刷新token的最后使用时间
    refreshTokenInfo.lastUsed = new Date();

    // 生成新的访问token
    const newTokens = this.generateTokens(
      {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role
      },
      options
    );

    // 移除旧的刷新token
    this.refreshTokenStore.delete(decoded.jti);

    return newTokens;
  }

  /**
   * 撤销token
   * @param {string} token - 要撤销的token
   * @param {string} tokenType - token类型
   */
  async revokeToken(token, tokenType = 'access') {
    try {
      const decoded = await this.verifyToken(token, tokenType);

      if (tokenType === 'access') {
        this.revokedTokens.add(decoded.jti);
      } else if (tokenType === 'refresh') {
        this.refreshTokenStore.delete(decoded.jti);
        // 同时撤销相关的访问token
        const refreshTokenInfo = this.refreshTokenStore.get(decoded.jti);
        if (refreshTokenInfo) {
          this.revokedTokens.add(refreshTokenInfo.accessTokenId);
        }
      }
    } catch (error) {
      // 即使token无效，也不抛出错误，因为撤销操作应该是幂等的
      console.warn('撤销token时发生错误:', error.message);
    }
  }

  /**
   * 撤销用户的所有token
   * @param {number} userId - 用户ID
   */
  revokeAllUserTokens(userId) {
    // 撤销所有刷新token
    for (const [tokenId, tokenInfo] of this.refreshTokenStore.entries()) {
      if (tokenInfo.userId === userId) {
        this.refreshTokenStore.delete(tokenId);
        this.revokedTokens.add(tokenInfo.accessTokenId);
      }
    }
  }

  /**
   * 获取用户的活跃会话
   * @param {number} userId - 用户ID
   * @returns {Array} 活跃会话列表
   */
  getUserActiveSessions(userId) {
    const sessions = [];

    for (const [tokenId, tokenInfo] of this.refreshTokenStore.entries()) {
      if (tokenInfo.userId === userId) {
        sessions.push({
          tokenId,
          createdAt: tokenInfo.createdAt,
          lastUsed: tokenInfo.lastUsed,
          userAgent: tokenInfo.userAgent,
          ipAddress: tokenInfo.ipAddress
        });
      }
    }

    return sessions.sort((a, b) => b.lastUsed - a.lastUsed);
  }

  /**
   * 解析过期时间字符串为秒数
   * @param {string} expiry - 过期时间字符串（如'15m', '7d'）
   * @returns {number} 秒数
   */
  parseExpiry(expiry) {
    const units = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
      w: 604800
    };

    const match = expiry.match(/^(\d+)([smhdw])$/);
    if (!match) {
      throw new Error(`无效的过期时间格式: ${expiry}`);
    }

    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }

  /**
   * 启动清理定时器
   */
  startCleanupInterval() {
    // 每小时清理一次过期的撤销token
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, 3600000); // 1小时
  }

  /**
   * 清理过期的token
   */
  cleanupExpiredTokens() {
    const now = new Date();
    const refreshTokenExpiry = this.parseExpiry(this.refreshTokenExpiry) * 1000;

    // 清理过期的刷新token
    for (const [tokenId, tokenInfo] of this.refreshTokenStore.entries()) {
      if (now - tokenInfo.createdAt > refreshTokenExpiry) {
        this.refreshTokenStore.delete(tokenId);
        this.revokedTokens.add(tokenInfo.accessTokenId);
      }
    }

    console.log(
      `[JWT] 清理完成，当前撤销token数量: ${this.revokedTokens.size}，活跃刷新token数量: ${this.refreshTokenStore.size}`
    );
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      revokedTokensCount: this.revokedTokens.size,
      activeRefreshTokensCount: this.refreshTokenStore.size,
      activeUsersCount: new Set([...this.refreshTokenStore.values()].map((info) => info.userId))
        .size
    };
  }
}

/**
 * 认证中间件
 * @param {Array} requiredRoles - 需要的角色列表
 * @returns {Function} Express中间件函数
 */
export const authenticateToken =
  (requiredRoles = []) =>
    (req, res, next) => {
    // 从请求头中获取 Authorization 字段
      const authHeader = req.headers.authorization;
      // 如果请求头存在，则提取 token 部分
      const token = authHeader && authHeader.split(' ')[1]?.trim();

      // 如果 token 不存在，则返回 401 Unauthorized
      if (token === null) {
        return res
          .status(401)
          .json({ error: { code: 'UNAUTHORIZED', message: '未提供身份验证令牌' } });
      }

      // 使用 jwt.verify 来验证 token
      jwt.verify(token, config.jwt.secret, (err, user) => {
        if (err) {
        // 如果 token 无效或已过期，则返回 403 Forbidden
          console.error('JWT 验证失败:', err);
          return res
            .status(403)
            .json({ error: { code: 'FORBIDDEN', message: '无效或已过期的令牌' } });
        }

        // 检查角色权限
        if (requiredRoles.length > 0 && (!user || !requiredRoles.includes(user.role))) {
          return res.status(403).json({
            error: { code: 'FORBIDDEN', message: `需要以下角色之一: ${requiredRoles.join(', ')}` }
          });
        }

        // 如果 token 有效，则将解码后的用户信息附加到请求对象上
        req.user = user;
        // 调用 next() 将控制权交给下一个中间件或路由处理器
        next();
      });
    };

/**
 * 可选认证中间件（不强制要求认证）
 */
export const optionalAuth = () => {
  const jwtManager = new JWTManager();

  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader) {
        const parts = authHeader.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          const [, token] = parts;
          const decoded = await jwtManager.verifyToken(token, 'access');

          req.user = {
            id: decoded.userId,
            username: decoded.username,
            role: decoded.role,
            tokenId: decoded.jti
          };
        }
      }
    } catch (error) {
      // 可选认证失败时不抛出错误，只是不设置用户信息
      console.warn('可选认证失败:', error.message);
    }

    next();
  };
};

// 创建默认的JWT管理器实例
export const defaultJWTManager = new JWTManager();

export default {
  JWTManager,
  authenticateToken,
  optionalAuth,
  defaultJWTManager
};
