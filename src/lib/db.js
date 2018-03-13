const mysql = require('mysql2/promise');

export const connect = async () => await mysql.createConnection({
  host:           process.env.DB_HOST,
  user:           process.env.DB_USERNAME,
  password:       process.env.DB_PASSWORD,
  database:       process.env.DB_DATABASE,
  connectTimeout: 1000,
});
