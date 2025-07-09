// db/seeds/users.js
const bcrypt = require('bcrypt');

module.exports.seed = async function(knex) {
  // 检查admin用户是否已存在
  const existingAdmin = await knex('users').where({ username: 'admin' }).first();
  if (!existingAdmin) {
    await knex('users').insert([{
      id: 1,
      username: 'admin',
      password_hash: await bcrypt.hash('secure_password', 10), // 使用实际加密密码
      role: 'admin',
      created_at: new Date()
    }]);
    console.log('Admin用户创建成功');
  } else {
    console.log('Admin用户已存在，跳过创建');
  }
};