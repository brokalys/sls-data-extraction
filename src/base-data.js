'use strict';

const mysql = require('mysql2/promise');
const moment = require('moment');

export const run = async (event, context, callback) => {
  const connection = await mysql.createConnection({
    host     : process.env.DB_HOST,
    user     : process.env.DB_USERNAME,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_DATABASE,
    connectTimeout: 1000,
  });

  const start = moment.utc().startOf('day').toISOString();
  const end = moment.utc().endOf('day').toISOString();

  const [data, fields] = await connection.execute(
    'SELECT id FROM properties WHERE created_at BETWEEN ? AND ?',
    [start, end],
  );

  const response = {
    matches: data.length,
  };

  connection.end();
  callback(null, response);
};
