import { dbPromise } from '../../infrastructure/database/index.js';

/**
 * 根据用户名获取用户信息
 * @param {string} username - 用户名
 * @returns {Promise<Object|null>} 用户对象或null
 */
export async function getUserByUsername(username) {
  const db = await dbPromise;
  return db('users').where({ username }).first();
}

/**
 * 更新用户最后登录时间
 * @param {string} userId - 用户ID
 * @returns {Promise<void>}
 */
export async function updateLastLogin(userId) {
  const db = await dbPromise;
  await db('users').where({ id: userId }).update({ last_login: db.fn.now() });
}

/**
 * 创建新用户
 * @param {Object} userData - 用户数据
 * @returns {Promise<void>}
 */
export async function createUser(userData) {
  const db = await dbPromise;
  await db('users').insert(userData);
}
