const connection = require('serverless-mysql')({
  config: {
    host:           process.env.DB_HOST,
    database:       process.env.DB_DATABASE,
    user:           process.env.DB_USERNAME,
    password:       process.env.DB_PASSWORD,
    connectTimeout: 1000,
  },
});
export default connection;
