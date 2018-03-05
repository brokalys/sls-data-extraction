'use strict';

const mysql   = require('mysql2/promise');
const moment  = require('moment');
const numbers = require('numbers');

export const run = async (event, context, callback) => {
  const connection = await mysql.createConnection({
    host:           process.env.DB_HOST,
    user:           process.env.DB_USERNAME,
    password:       process.env.DB_PASSWORD,
    database:       process.env.DB_DATABASE,
    connectTimeout: 1000,
  });

  const start = moment.utc().startOf('day').toISOString();
  const end = moment.utc().endOf('day').toISOString();

  const [data, fields] = await connection.query({
    sql: `
      SELECT price
      FROM properties
      WHERE created_at BETWEEN ? AND ?
      AND price > 0
      AND type = ?
    `,

    values: [start, end, 'sell'],

    typeCast(field, next) {
      if (field.type === 'NEWDECIMAL') {
        return parseFloat(field.string());
      }

      return next();
    },
  });

  const prices = data.map(({ price }) => price);

  const response = {
    count:        prices.length,
    max:          parseInt(numbers.basic.max(prices), 10),
    min:          parseInt(numbers.basic.min(prices), 10),
    min:          parseInt(numbers.basic.min(prices), 10),
    mean:         parseInt(numbers.statistic.mean(prices), 10),
    median:       parseInt(numbers.statistic.median(prices), 10),
    mode:         parseInt(numbers.statistic.mode(prices), 10),
    standardDev:  parseInt(numbers.statistic.standardDev(prices), 10),
  };

  connection.end();
  callback(null, response);
};
