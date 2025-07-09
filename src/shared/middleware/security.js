import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import {
/* eslint-disable no-magic-numbers */
  AuthenticationError,
  AuthorizationError,
  ValidationError
} from '../utils/AppError.js';
import logger from '../utils/logger.js';

/**
 * JWT认证中间件增强版
 * 支持多种token来源、token刷新、黑名单检查
 */
export class JWTAuthenticator {
  constructor(options = {}) {
    this.secret = options.secret || process.env.JWT_SECRET || 'default-secret';
    this.refreshSecret =
      options.refreshSecret || process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
    this.tokenExpiry = options.tokenExpiry || '15m';
    this.refreshTokenExpiry = options.refreshTokenExpiry || '7d';
    this.blacklistedTokens = new Set(); // 简单的内存黑名单，生产环境应使用Redis
    this.algorithm = options.algorithm || 'HS256';
  }

  /**
   * 生成访问令牌
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.tokenExpiry,
      algorithm: this.algorithm,
      issuer: 'zero-carbon-system',
      audience: 'zero-carbon-users'
    });
  }

  /**
   * 生成刷新令牌
   */
  generateRefreshToken(payload) {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshTokenExpiry,
      algorithm: this.algorithm,
      issuer: 'zero-carbon-system',
      audience: 'zero-carbon-users'
    });
  }

  /**
   * 验证访问令牌
   */
  verifyAccessToken(token) {
    try {
      if (this.blacklistedTokens.has(token)) {
        throw new AuthenticationError('令牌已被撤销');
      }

      return jwt.verify(token, this.secret, {
        algorithms: [this.algorithm],
        issuer: 'zero-carbon-system',
        audience: 'zero-carbon-users'
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('令牌已过期');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('无效的令牌');
      }
      throw error;
    }
  }

  /**
   * 验证刷新令牌
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshSecret, {
        algorithms: [this.algorithm],
        issuer: 'zero-carbon-system',
        audience: 'zero-carbon-users'
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('刷新令牌已过期');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('无效的刷新令牌');
      }
      throw error;
    }
  }

  /**
   * 从请求中提取令牌
   */
  extractToken(req) {
    // 1. 从Authorization头提取
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 2. 从Cookie提取
    if (req.cookies && req.cookies.accessToken) {
      return req.cookies.accessToken;
    }

    // 3. 从查询参数提取（不推荐，仅用于特殊情况）
    if (req.query.token) {
      return req.query.token;
    }

    return null;
  }

  /**
   * 撤销令牌（加入黑名单）
   */
  revokeToken(token) {
    this.blacklistedTokens.add(token);
    logger.info('令牌已撤销', { tokenHash: this.hashToken(token) });
  }

  /**
   * 令牌哈希（用于日志记录，避免泄露完整令牌）
   */
  hashToken(token) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
  }

  /**
   * 认证中间件
   */
  authenticate(_options = {}) {
    return (req, res, next) => {
      try {
        const token = this.extractToken(req);

        if (!token) {
          throw new AuthenticationError('缺少认证令牌');
        }

        const decoded = this.verifyAccessToken(token);
        req.user = decoded;
        req.token = token;

        // 记录认证成功日志
        logger.info('用户认证成功', {
          userId: decoded.id,
          username: decoded.username,
          role: decoded.role,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        next();
      } catch (error) {
        logger.warn('认证失败', {
          error: error.message,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path
        });
        next(error);
      }
    };
  }

  /**
   * 角色授权中间件
   */
  authorize(requiredRoles = []) {
    return (req, res, next) => {
      try {
        if (!req.user) {
          throw new AuthenticationError('用户未认证');
        }

        const userRole = req.user.role;
        const hasPermission = Array.isArray(requiredRoles)
          ? requiredRoles.includes(userRole)
          : requiredRoles === userRole;

        if (!hasPermission) {
          throw new AuthorizationError('权限不足', {
            requiredRoles,
            userRole
          });
        }

        next();
      } catch (error) {
        logger.warn('授权失败', {
          error: error.message,
          userId: req.user?.id,
          userRole: req.user?.role,
          requiredRoles,
          path: req.path
        });
        next(error);
      }
    };
  }
}

/**
 * 安全头中间件
 */
export const securityHeaders = () => (req, res, next) => {
  // 设置安全响应头
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // 移除可能泄露服务器信息的头
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  next();
};

/**
 * API速率限制中间件
 */
export const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 每个IP最多100个请求
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '请求过于频繁，请稍后再试'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) =>
      // 跳过健康检查和静态资源
      req.path === '/health' || req.path.startsWith('/static/'),
    keyGenerator: (req) =>
      // 对认证用户使用用户ID，对匿名用户使用IP
      req.user?.id || req.ip,
    onLimitReached: (req, _res, _options) => {
      logger.warn('速率限制触发', {
        ip: req.ip,
        userId: req.user?.id,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent')
      });
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

/**
 * 输入大小限制中间件
 */
export const inputSizeLimit = (options = {}) => {
  const maxBodySize = options.maxBodySize || 1024 * 1024; // 1MB
  const maxQueryLength = options.maxQueryLength || 1000;
  const maxHeaderSize = options.maxHeaderSize || 8192;

  return (req, res, next) => {
    try {
      // 检查请求体大小
      const contentLength = parseInt(req.get('Content-Length') || '0');
      if (contentLength > maxBodySize) {
        throw new ValidationError('请求体过大', {
          maxSize: maxBodySize,
          actualSize: contentLength
        });
      }

      // 检查查询字符串长度
      const queryString = req.url.split('?')[1] || '';
      if (queryString.length > maxQueryLength) {
        throw new ValidationError('查询参数过长', {
          maxLength: maxQueryLength,
          actualLength: queryString.length
        });
      }

      // 检查头部大小
      const headerSize = JSON.stringify(req.headers).length;
      if (headerSize > maxHeaderSize) {
        throw new ValidationError('请求头过大', {
          maxSize: maxHeaderSize,
          actualSize: headerSize
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * IP白名单中间件
 */
export const ipWhitelist =
  (allowedIPs = []) =>
    (req, res, next) => {
      const clientIP = req.ip || req.connection.remoteAddress;

      if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
        logger.warn('IP访问被拒绝', {
          ip: clientIP,
          path: req.path,
          userAgent: req.get('User-Agent')
        });

        throw new AuthorizationError('访问被拒绝');
      }

      next();
    };

/**
 * 请求ID中间件（用于请求追踪）
 */
export const requestId = () => (req, res, next) => {
  const requestId =
    req.get('X-Request-ID') || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
};

// 导出默认的JWT认证器实例
export const defaultJWTAuth = new JWTAuthenticator({
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  tokenExpiry: process.env.JWT_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
});
