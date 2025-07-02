// 引入必要的模块
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// 定义角色常量
export const roles = {
  ADMIN: 0,
  ENERGY_MANAGER: 1,
  CARBON_CALCULATION_VIEWER: 2,
  MANAGE_CARBON_CALCULATION: 3,
  SYSTEM_MONITOR: 4
};

// 用户权限定义
const permissions = {
  MANAGE_USERS: 'manage_users',
  MANAGE_DEVICES: 'manage_devices',
  VIEW_ENERGY_DATA: 'view_energy_data',
  MANAGE_ENERGY_PREDICTION: 'manage_energy_prediction',
  MANAGE_CARBON_CALCULATION: 'manage_carbon_calculation',
  ACCESS_DASHBOARD: 'access_dashboard'
};

// 角色权限映射
const rolePermissions = {
  [roles.ADMIN]: Object.values(permissions),
  [roles.ENERGY_MANAGER]: [
    permissions.VIEW_ENERGY_DATA,
    permissions.MANAGE_ENERGY_PREDICTION,
    permissions.MANAGE_CARBON_CALCULATION,
    permissions.ACCESS_DASHBOARD
  ],
  [roles.VIEWER]: [
    permissions.VIEW_ENERGY_DATA,
    permissions.ACCESS_DASHBOARD
  ]
};

// 权限验证中间件
export function authenticateToken(req, res, next) {
  // 从请求头中获取令牌
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  // 如果没有令牌，返回401未授权
  if (!token) {
    return res.status(401).json({ error: '缺少访问令牌' });
  }
  
  // 验证令牌
  jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key', (err, user) => {
    // 如果验证失败，返回403禁止访问
    if (err) {
      return res.status(403).json({ error: '无效的访问令牌' });
    }
    
    // 将用户信息附加到请求对象
    req.user = user;
    
    // 继续执行下一个中间件
    next();
  });
}

// 生成新的访问令牌
export function generateAccessToken(user) {
  // 签发新的令牌
  return jwt.sign(
    {
      username: user.username,
      role: user.role,
      userId: user.userId || uuidv4()
    },
    process.env.JWT_SECRET || 'default_secret_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

// 检查用户权限
export function checkPermission(requiredRole) {
  return (req, res, next) => {
    // 检查用户是否有足够的权限
    if (!req.user || !req.user.role || req.user.role < requiredRole) {
      return res.status(403).json({ error: '没有足够的权限执行此操作' });
    }
    
    // 用户有足够权限，继续执行下一个中间件
    next();
  };
}

// 用户权限管理
export function setupUserRoutes(app, authenticateToken) {
  // 获取所有用户
  app.get('/users', authenticateToken, (req, res) => {
    const users = Array.from(usersDB.values()).map(user => ({
      id: user.id,
      username: user.username,
      roles: user.roles
    }));
    
    res.json(users);
  });

  // 创建新用户
  app.post('/users', authenticateToken, (req, res) => {
    const { username, password, role } = req.body;
    
    if (!username || !password || !role) {
      res.status(400).json({ error: '缺少必要参数' });
      return;
    }
    
    if (roles[role] === undefined) {
      res.status(400).json({ error: '无效的角色' });
      return;
    }
    
    // 检查用户名是否已存在
    const existingUser = Array.from(usersDB.values()).find(u => u.username === username);
    if (existingUser) {
      res.status(400).json({ error: '用户名已存在' });
      return;
    }
    
    // 创建新用户
    const newUser = {
      id: Date.now(),
      username,
      password: hashPassword(password),
      roles: [role]
    };
    
    usersDB.set(newUser.id, newUser);
    saveUsersToFile();
    
    // 返回创建的用户（不包含密码）
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  });
}