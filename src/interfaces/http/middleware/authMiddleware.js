/* eslint-disable no-console, no-magic-numbers */
/**
 * 认证中间件
 * 用于验证JWT令牌和用户身份
 */

const jwt = require('jsonwebtoken');
const responseFormatter = require('./responseFormatter');

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// 令牌黑名单（在生产环境中应使用Redis等外部存储）
const tokenBlacklist = new Set();

/**
 * 生成访问令牌
 * @param {Object} payload - 令牌载荷
 * @returns {string} JWT令牌
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'carbon-management-system',
    audience: 'carbon-management-client'
  });
}

/**
 * 生成刷新令牌
 * @param {Object} payload - 令牌载荷
 * @returns {string} JWT刷新令牌
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'carbon-management-system',
    audience: 'carbon-management-client'
  });
}

/**
 * 验证访问令牌
 * @param {string} token - JWT令牌
 * @returns {Object} 解码后的载荷
 */
function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'carbon-management-system',
    audience: 'carbon-management-client'
  });
}

/**
 * 验证刷新令牌
 * @param {string} token - JWT刷新令牌
 * @returns {Object} 解码后的载荷
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET, {
    issuer: 'carbon-management-system',
    audience: 'carbon-management-client'
  });
}

/**
 * 将令牌加入黑名单
 * @param {string} token - 要加入黑名单的令牌
 */
function blacklistToken(token) {
  tokenBlacklist.add(token);

  // 定期清理过期的令牌（简单实现，生产环境应使用更高效的方法）
  setTimeout(
    () => {
      tokenBlacklist.delete(token);
    },
    24 * 60 * 60 * 1000
  ); // 24小时后清理
}

/**
 * 检查令牌是否在黑名单中
 * @param {string} token - 要检查的令牌
 * @returns {boolean} 是否在黑名单中
 */
function isTokenBlacklisted(token) {
  return tokenBlacklist.has(token);
}

/**
 * 从请求中提取令牌
 * @param {Object} req - Express请求对象
 * @returns {string|null} 提取的令牌
 */
function extractToken(req) {
  // 从Authorization头中提取
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 从查询参数中提取
  if (req.query.token) {
    return req.query.token;
  }

  // 从Cookie中提取
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
}

/**
 * 认证中间件
 * 验证用户身份并将用户信息附加到请求对象
 */
function authenticate(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      return responseFormatter.unauthorized(res, '缺少访问令牌');
    }

    // 检查令牌是否在黑名单中
    if (isTokenBlacklisted(token)) {
      return responseFormatter.unauthorized(res, '令牌已失效');
    }

    // 验证令牌
    const decoded = verifyAccessToken(token);

    // 检查令牌是否包含必要的用户信息
    if (!decoded.userId || !decoded.username || !decoded.role) {
      return responseFormatter.unauthorized(res, '令牌格式无效');
    }

    // 将用户信息附加到请求对象
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
      tokenId: decoded.jti, // JWT ID
      issuedAt: decoded.iat,
      expiresAt: decoded.exp
    };

    // 将原始令牌也附加到请求对象（用于注销等操作）
    req.token = token;

    // 记录认证日志
    console.log(
      `[${new Date().toISOString()}] Authentication: User ${decoded.username} (${decoded.role}) authenticated`
    );

    next();
  } catch (error) {
    console.error('认证错误:', error);

    if (error.name === 'TokenExpiredError') {
      return responseFormatter.unauthorized(res, '令牌已过期');
    } else if (error.name === 'JsonWebTokenError') {
      return responseFormatter.unauthorized(res, '令牌无效');
    } else if (error.name === 'NotBeforeError') {
      return responseFormatter.unauthorized(res, '令牌尚未生效');
    } 
    return responseFormatter.internalError(res, '认证失败', error);
    
  }
}

/**
 * 可选认证中间件
 * 如果提供了令牌则验证，否则继续执行
 */
function optionalAuthenticate(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      // 没有令牌，继续执行但不设置用户信息
      return next();
    }

    // 检查令牌是否在黑名单中
    if (isTokenBlacklisted(token)) {
      // 令牌在黑名单中，继续执行但不设置用户信息
      return next();
    }

    // 验证令牌
    const decoded = verifyAccessToken(token);

    // 检查令牌是否包含必要的用户信息
    if (decoded.userId && decoded.username && decoded.role) {
      // 将用户信息附加到请求对象
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || [],
        tokenId: decoded.jti,
        issuedAt: decoded.iat,
        expiresAt: decoded.exp
      };

      req.token = token;

      console.log(
        `[${new Date().toISOString()}] Optional Authentication: User ${decoded.username} (${decoded.role}) authenticated`
      );
    }

    next();
  } catch (error) {
    // 可选认证失败时不返回错误，继续执行
    console.warn('可选认证失败:', error.message);
    next();
  }
}

/**
 * 刷新令牌中间件
 * 验证刷新令牌并生成新的访问令牌
 */
function refreshToken(req, res, next) {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

    if (!refreshToken) {
      return responseFormatter.unauthorized(res, '缺少刷新令牌');
    }

    // 验证刷新令牌
    const decoded = verifyRefreshToken(refreshToken);

    // 检查刷新令牌是否包含必要的用户信息
    if (!decoded.userId || !decoded.username || !decoded.role) {
      return responseFormatter.unauthorized(res, '刷新令牌格式无效');
    }

    // 生成新的访问令牌
    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions
    });

    // 可选：生成新的刷新令牌（滚动刷新）
    const newRefreshToken = generateRefreshToken({
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    });

    // 将新令牌附加到响应对象
    res.locals.newTokens = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: JWT_EXPIRES_IN
    };

    // 将用户信息附加到请求对象
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || []
    };

    console.log(
      `[${new Date().toISOString()}] Token Refresh: User ${decoded.username} tokens refreshed`
    );

    next();
  } catch (error) {
    console.error('令牌刷新错误:', error);

    if (error.name === 'TokenExpiredError') {
      return responseFormatter.unauthorized(res, '刷新令牌已过期');
    } else if (error.name === 'JsonWebTokenError') {
      return responseFormatter.unauthorized(res, '刷新令牌无效');
    } 
    return responseFormatter.internalError(res, '令牌刷新失败', error);
    
  }
}

/**
 * 注销中间件
 * 将当前令牌加入黑名单
 */
function logout(req, res, next) {
  try {
    const token = extractToken(req);

    if (token) {
      // 将令牌加入黑名单
      blacklistToken(token);
      console.log(
        `[${new Date().toISOString()}] Logout: Token blacklisted for user ${req.user?.username || 'unknown'}`
      );
    }

    // 清除用户信息
    req.user = null;
    req.token = null;

    next();
  } catch (error) {
    console.error('注销错误:', error);
    return responseFormatter.internalError(res, '注销失败', error);
  }
}

/**
 * 检查令牌有效期中间件
 * 如果令牌即将过期，在响应头中添加提示
 */
function checkTokenExpiry(req, res, next) {
  if (req.user && req.user.expiresAt) {
    const now = Math.floor(Date.now() / 1000);
    const timeToExpiry = req.user.expiresAt - now;

    // 如果令牌在30分钟内过期，添加警告头
    if (timeToExpiry < 30 * 60) {
      res.set('X-Token-Warning', 'Token expires soon');
      res.set('X-Token-Expires-In', timeToExpiry.toString());
    }
  }

  next();
}

/**
 * 速率限制中间件（基于用户）
 * @param {number} maxRequests - 最大请求数
 * @param {number} windowMs - 时间窗口（毫秒）
 * @returns {Function} Express中间件函数
 */
function userRateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  const userRequests = new Map();

  return (req, res, next) => {
    const userId = req.user?.userId || req.ip;
    const now = Date.now();

    if (!userRequests.has(userId)) {
      userRequests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const userRequest = userRequests.get(userId);

    if (now > userRequest.resetTime) {
      // 重置计数器
      userRequest.count = 1;
      userRequest.resetTime = now + windowMs;
      return next();
    }

    if (userRequest.count >= maxRequests) {
      return responseFormatter.tooManyRequests(res, '请求过于频繁，请稍后再试');
    }

    userRequest.count++;
    next();
  };
}

module.exports = {
  authenticate,
  optionalAuthenticate,
  refreshToken,
  logout,
  checkTokenExpiry,
  userRateLimit,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  blacklistToken,
  isTokenBlacklisted,
  extractToken
};
