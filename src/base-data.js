import connection from './lib/db';
import github from './lib/github';
import typeCast from './lib/mysql-typecast';
import moment from 'moment';
import numbers from 'numbers';

export const run = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const category = process.env.PROPERTY_CATEGORY;

  const start = moment.utc().subtract(1, 'day').startOf('day').toISOString();
  const end = moment.utc().subtract(1, 'day').endOf('day').toISOString();

  const data = await connection.query({
    sql: `
      SELECT price
      FROM properties
      WHERE created_at BETWEEN ? AND ?
      AND (source LIKE "%.lv" OR source LIKE "%.eu")
      AND price >= 1
      AND type = ?
    `,

    values: [start, end, category],

    typeCast,
  });

  const prices = data.map(({ price }) => price);

  const stats = {
    count:        prices.length,
    min:          parseInt(numbers.basic.min(prices), 10) || 0,
    max:          parseInt(numbers.basic.max(prices), 10) || 0,
    mean:         parseInt(numbers.statistic.mean(prices), 10) || 0,
    median:       parseInt(numbers.statistic.median(prices), 10) || 0,
    mode:         parseInt(numbers.statistic.mode(prices), 10) || 0,
    standardDev:  parseInt(numbers.statistic.standardDev(prices), 10) || 0,
  };

  connection.end();

  await github.appendToFile(
    `daily-${category.replace(/_/g, '-')}.csv`,
    `"${start.substr(0, 10)}","${stats.count}","${stats.min}","${stats.max}","${stats.mean}","${stats.median}","${stats.mode}","${stats.standardDev}"`,
    `Daily data: ${start.substr(0, 10)}`
  );

  callback(null, stats);
};
