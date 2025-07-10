export default {
  // 数据库类型
  client: 'sqlite3',
  
  // 连接配置
  connection: {
    // SQLite配置
    filename: './database.sqlite',
    
    // MySQL/PostgreSQL配置示例
    // host: 'localhost',
    // port: 3306,
    // user: 'root',
    // password: process.env.DB_PASSWORD || 'default',
    // database: 'carbon_management'
  },
  
  // 连接池配置
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100
  },
  
  // 迁移配置
  migrations: {
    tableName: 'migrations',
    directory: './migrations',
    extension: 'js',
    loadExtensions: ['.js'],
    sortDirsSeparately: false
  },
  
  // 种子数据配置
  seeds: {
    directory: './seeds',
    extension: 'js',
    loadExtensions: ['.js']
  },
  
  // 环境配置
  environments: {
    development: {
      client: 'sqlite3',
      connection: {
        filename: './dev.sqlite'
      },
      useNullAsDefault: true
    },
    
    test: {
      client: 'sqlite3',
      connection: {
        filename: ':memory:'
      },
      useNullAsDefault: true
    },
    
    production: {
      client: 'mysql2',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'carbon_management'
      },
      pool: {
        min: 2,
        max: 10
      }
    }
  }
};
