import express from 'express';
import { body } from 'express-validator';
import AuthController from '../controllers/AuthController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// 验证规则
const loginValidation = [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位')
];

const registerValidation = [
  body('username').isLength({ min: 3 }).withMessage('用户名至少3位'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('email').isEmail().withMessage('邮箱格式不正确')
];

const updateProfileValidation = [
  body('email').optional().isEmail().withMessage('邮箱格式不正确'),
  body('currentPassword').optional().isLength({ min: 6 }).withMessage('当前密码至少6位'),
  body('newPassword').optional().isLength({ min: 6 }).withMessage('新密码至少6位')
];

// 用户登录
router.post('/login', loginValidation, AuthController.login);

// 用户注册
router.post('/register', registerValidation, AuthController.register);

// 获取当前用户信息
router.get('/profile', authMiddleware.authenticate, AuthController.getCurrentUser);

// 更新用户信息
router.put(
  '/profile',
  authMiddleware.authenticate,
  updateProfileValidation,
  AuthController.updateProfile
);

// 用户登出
router.post('/logout', authMiddleware.authenticate, AuthController.logout);

// 刷新token
router.post('/refresh', AuthController.refreshToken);

// 权限检查
router.get('/permission/:permission', authMiddleware.authenticate, AuthController.checkPermission);

export default router;
