module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306,
      database: 'zero_carbon_park'
    },
    migrations: {
      directory: './src/migrations'
    },
    useNullAsDefault: true
  }
};