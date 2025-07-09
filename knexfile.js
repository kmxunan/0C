const path = require('path');
// 使用CommonJS内置的__dirname变量

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, 'data', 'carbon_management.db'),
    },
    seeds: {
      directory: path.join(__dirname, 'src', 'db', 'seeds'),
    },
    migrations: {
      directory: path.resolve(__dirname, 'src', 'migrations'),
      extension: 'cjs',
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn, done) => {
        conn.run('PRAGMA foreign_keys = ON', done);
      },
    },
  },
  production: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, 'data', 'carbon_management.db'),
    },
    migrations: {
      directory: path.resolve(__dirname, 'src', 'migrations'),
      extension: 'cjs',
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn, done) => {
        conn.run('PRAGMA foreign_keys = ON', done);
      },
    },
  },
};
