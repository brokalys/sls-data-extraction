import connection from './lib/db';
import github from './lib/github';
import typeCast from './lib/mysql-typecast';
import moment from 'moment';

export const run = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const start = moment.utc().subtract(1, 'week').startOf('isoWeek').toISOString();
  const end = moment.utc().subtract(1, 'week').endOf('isoWeek').toISOString();

  const data = await connection.query({
    sql: `
      SELECT source, COUNT(*) as count
      FROM properties
      WHERE created_at BETWEEN ? AND ?
      AND (source LIKE "%.lv" OR source LIKE "%.eu")
      GROUP BY source
      ORDER BY count DESC
    `,

    values: [start, end],

    typeCast,
  });

  const total = data.map(({ count }) => count).reduce((a, b) => a + b);

  const stats = {
    'ss.lv':        (((data.find(({ source }) => source === 'ss.lv') || {}).count || 0) / total).toFixed(2),
    'city24.lv':    (((data.find(({ source }) => source === 'city24.lv') || {}).count || 0) / total).toFixed(2),
    'dada.lv':      (((data.find(({ source }) => source === 'dada.lv') || {}).count || 0) / total).toFixed(2),
    'reklama.lv':   (((data.find(({ source }) => source === 'reklama.lv') || {}).count || 0) / total).toFixed(2),
    'elots.lv':     (((data.find(({ source }) => source === 'elots.lv') || {}).count || 0) / total).toFixed(2),
    'zip.lv':       (((data.find(({ source }) => source === 'zip.lv') || {}).count || 0) / total).toFixed(2),
    'santims.lv':   (((data.find(({ source }) => source === 'santims.lv') || {}).count || 0) / total).toFixed(2),
    'cityreal.lv':  (((data.find(({ source }) => source === 'cityreal.lv') || {}).count || 0) / total).toFixed(2),
    'takari.eu':    (((data.find(({ source }) => source === 'takari.eu') || {}).count || 0) / total).toFixed(2),
  };

  stats.other = (1 - stats['ss.lv'] - stats['city24.lv'] - stats['dada.lv'] - stats['reklama.lv'] - stats['elots.lv'] - stats['zip.lv'] - stats['santims.lv'] - stats['cityreal.lv'] - stats['takari.eu']).toFixed(2);

  connection.end();

  await github.appendToFile(
    'weekly-market-share.csv',
    `"${start.substr(0, 10)}","${end.substr(0, 10)}","${stats['ss.lv']}","${stats['city24.lv']}","${stats['dada.lv']}","${stats['reklama.lv']}","${stats['elots.lv']}","${stats['zip.lv']}","${stats['santims.lv']}","${stats['cityreal.lv']}","${stats['takari.eu']}","${stats.other}"`,
    `Weekly data: ${start.substr(0, 10)} - ${end.substr(0, 10)}`
  );

  callback(null, stats);
};
