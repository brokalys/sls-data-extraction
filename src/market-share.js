'use strict';

const mysql   = require('mysql2/promise');
const moment  = require('moment');
const numbers = require('numbers');
const octokit = require('@octokit/rest')();

export const run = async (event, context, callback) => {
  const connection = await mysql.createConnection({
    host:           process.env.DB_HOST,
    user:           process.env.DB_USERNAME,
    password:       process.env.DB_PASSWORD,
    database:       process.env.DB_DATABASE,
    connectTimeout: 1000,
  });

  const start = moment.utc().subtract(1, 'week').startOf('isoWeek').toISOString();
  const end = moment.utc().subtract(1, 'week').endOf('isoWeek').toISOString();

  const [data, fields] = await connection.query({
    sql: `
      SELECT source, COUNT(*) as count
      FROM properties
      WHERE created_at BETWEEN ? AND ?
      AND (source LIKE "%.lv" OR source LIKE "%.eu")
      GROUP BY source
      ORDER BY count DESC
    `,

    values: [start, end],

    typeCast(field, next) {
      if (field.type === 'NEWDECIMAL') {
        return parseFloat(field.string());
      }

      return next();
    },
  });

  const total = data.map(({ count }) => count).reduce((a, b) => a + b);

  const stats = {
    start,
    end,

    'ss.lv':        (((data.find(({ source }) => source === 'ss.lv') || {}).count || 0) / total).toFixed(2),
    'city24.lv':    (((data.find(({ source }) => source === 'city24.lv') || {}).count || 0) / total).toFixed(2),
    'dada.lv':      (((data.find(({ source }) => source === 'dada.lv') || {}).count || 0) / total).toFixed(2),
    'reklama.lv':   (((data.find(({ source }) => source === 'reklama.lv') || {}).count || 0) / total).toFixed(2),
    'elots.lv':     (((data.find(({ source }) => source === 'elots.lv') || {}).count || 0) / total).toFixed(2),
    'zip.lv':       (((data.find(({ source }) => source === 'zip.lv') || {}).count || 0) / total).toFixed(2),
    'varianti.lv':  (((data.find(({ source }) => source === 'varianti.lv') || {}).count || 0) / total).toFixed(2),
    'santims.lv':   (((data.find(({ source }) => source === 'santims.lv') || {}).count || 0) / total).toFixed(2),
    'cityreal.lv':  (((data.find(({ source }) => source === 'cityreal.lv') || {}).count || 0) / total).toFixed(2),
    'takari.eu':    (((data.find(({ source }) => source === 'takari.eu') || {}).count || 0) / total).toFixed(2),
  };

  stats.other = (1 - stats['ss.lv'] - stats['city24.lv'] - stats['dada.lv'] - stats['reklama.lv'] - stats['elots.lv'] - stats['zip.lv'] - stats['varianti.lv'] - stats['santims.lv'] - stats['cityreal.lv'] - stats['takari.eu']).toFixed(2);

  connection.end();

  await uploadToGithub(stats);

  callback(null, stats);
};

const uploadToGithub = async (data) => {
  await octokit.authenticate({
    type: 'token',
    token: process.env.GITHUB_TOKEN,
  });

  const { data: currentFile } = await octokit.repos.getContent({
    owner: 'brokalys',
    repo: 'data',
    path: 'data/weekly-market-share.csv',
  });

  let content = new Buffer(currentFile.content, 'base64').toString();
  content += `"${data.start.substr(0, 10)}","${data.end.substr(0, 10)}","${data['ss.lv']}","${data['city24.lv']}","${data['dada.lv']}","${data['reklama.lv']}","${data['elots.lv']}","${data['zip.lv']}","${data['varianti.lv']}","${data['santims.lv']}","${data['cityreal.lv']}","${data['takari.eu']}","${data.other}"\n`;

  await octokit.repos.updateFile({
    owner: 'brokalys',
    repo: 'data',
    path: currentFile.path,
    message: `Weekly data: ${data.start} - ${data.end}`,
    content: new Buffer(content).toString('base64'),
    sha: currentFile.sha,
    author: {
      name: 'Brokalys bot',
      email: 'noreply@brokalys.com',
    },
  });
};
