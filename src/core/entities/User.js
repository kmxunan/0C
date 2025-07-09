import db from '../../infrastructure/database/index.js';
import logger from '../../shared/utils/logger.js';

/**
 * 用户实体类
 * 处理用户相关的数据操作
 */
class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.password = data.password;
    this.email = data.email;
    this.role = data.role || 'viewer';
    this.status = data.status || 'active';
    this.permissions = data.permissions || [];
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.lastLoginAt = data.lastLoginAt;
  }

  /**
   * 根据用户名查找用户
   */
  static async findByUsername(username) {
    try {
      const query = 'SELECT * FROM users WHERE username = ? LIMIT 1';
      const result = await db.get(query, [username]);
      return result ? new User(result) : null;
    } catch (error) {
      logger.error('查找用户失败', { error: error.message, username });
      throw error;
    }
  }

  /**
   * 根据邮箱查找用户
   */
  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = ? LIMIT 1';
      const result = await db.get(query, [email]);
      return result ? new User(result) : null;
    } catch (error) {
      logger.error('根据邮箱查找用户失败', { error: error.message, email });
      throw error;
    }
  }

  /**
   * 根据ID查找用户
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = ? LIMIT 1';
      const result = await db.get(query, [id]);
      return result ? new User(result) : null;
    } catch (error) {
      logger.error('根据ID查找用户失败', { error: error.message, id });
      throw error;
    }
  }

  /**
   * 创建新用户
   */
  static async create(userData) {
    try {
      const query = `
        INSERT INTO users (username, password, email, role, status, permissions, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const now = new Date().toISOString();
      const permissions = JSON.stringify(userData.permissions || []);
      
      const result = await db.run(query, [
        userData.username,
        userData.password,
        userData.email,
        userData.role,
        userData.status,
        permissions,
        now,
        now
      ]);

      const newUser = await User.findById(result.lastID);
      logger.info('用户创建成功', { userId: result.lastID, username: userData.username });
      return newUser;
    } catch (error) {
      logger.error('创建用户失败', { error: error.message, userData });
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      
      Object.keys(updateData).forEach(key => {
        if (key !== 'id') {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });
      
      if (fields.length === 0) {
        throw new Error('没有要更新的字段');
      }
      
      fields.push('updatedAt = ?');
      values.push(new Date().toISOString());
      values.push(id);
      
      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      await db.run(query, values);
      
      const updatedUser = await User.findById(id);
      logger.info('用户更新成功', { userId: id, updateData });
      return updatedUser;
    } catch (error) {
      logger.error('更新用户失败', { error: error.message, id, updateData });
      throw error;
    }
  }

  /**
   * 更新最后登录时间
   */
  static async updateLastLogin(id) {
    try {
      const query = 'UPDATE users SET lastLoginAt = ?, updatedAt = ? WHERE id = ?';
      const now = new Date().toISOString();
      await db.run(query, [now, now, id]);
      logger.info('更新最后登录时间成功', { userId: id });
    } catch (error) {
      logger.error('更新最后登录时间失败', { error: error.message, id });
      throw error;
    }
  }

  /**
   * 删除用户
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM users WHERE id = ?';
      const result = await db.run(query, [id]);
      logger.info('用户删除成功', { userId: id });
      return result.changes > 0;
    } catch (error) {
      logger.error('删除用户失败', { error: error.message, id });
      throw error;
    }
  }

  /**
   * 获取所有用户
   */
  static async findAll(options = {}) {
    try {
      const { limit = 50, offset = 0, role, status } = options;
      let query = 'SELECT * FROM users';
      const params = [];
      const conditions = [];
      
      if (role) {
        conditions.push('role = ?');
        params.push(role);
      }
      
      if (status) {
        conditions.push('status = ?');
        params.push(status);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const results = await db.all(query, params);
      return results.map(row => new User(row));
    } catch (error) {
      logger.error('获取用户列表失败', { error: error.message, options });
      throw error;
    }
  }

  /**
   * 统计用户数量
   */
  static async count(options = {}) {
    try {
      const { role, status } = options;
      let query = 'SELECT COUNT(*) as count FROM users';
      const params = [];
      const conditions = [];
      
      if (role) {
        conditions.push('role = ?');
        params.push(role);
      }
      
      if (status) {
        conditions.push('status = ?');
        params.push(status);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      const result = await db.get(query, params);
      return result.count;
    } catch (error) {
      logger.error('统计用户数量失败', { error: error.message, options });
      throw error;
    }
  }
}

export default User;