import mysql from 'mysql2/promise';

async function createDatabase() {
  try {
    console.log('尝试连接到MySQL服务器...');
    console.log('连接参数: host=localhost, port=3306, user=root');
    
    // 连接到MySQL服务器（不指定数据库）
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306,
      connectTimeout: 10000
    });
    
    console.log('成功连接到MySQL服务器');
    
    // 创建数据库
    await connection.query('CREATE DATABASE IF NOT EXISTS zero_carbon_park;');
    console.log('数据库创建成功或已存在');
    
    await connection.end();
  } catch (err) {
    console.error('连接或创建数据库失败:');
    console.error('错误代码:', err.code);
    console.error('错误信息:', err.message);
    console.error('请检查MySQL服务器是否运行，端口是否正确，以及root用户是否允许无密码连接');
    process.exit(1);
  }
}

createDatabase();