import github from './lib/github';
import axios from 'axios';
import moment from 'moment';

export const run = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const type = process.env.PROPERTY_CATEGORY;

  const start = moment.utc().subtract(1, 'day').startOf('day').toISOString();
  const end = moment.utc().subtract(1, 'day').endOf('day').toISOString();

  const { data: response } = await axios.post(
    'https://api.brokalys.com',
    {
      query: `
        {
          properties(
            filter: {
              created_at: { gte: "${start}", lte: "${end}" }
              type: { eq: "${type}" }
              price: { gte: 1 }
            },
            limit: null
          ) {
            summary {
              count
              price {
                min
                max
                mean
                median
                mode
                standardDev
              }
            }
          }
        }
      `,
    },
    {
      headers: {
        Authorization: process.env.BROKALYS_PRIVATE_KEY,
      },
    },
  );

  const stats = {
    count: response.data.properties.summary.count,
    min: response.data.properties.summary.price.min,
    max: response.data.properties.summary.price.max,
    mean: response.data.properties.summary.price.mean,
    median: response.data.properties.summary.price.median,
    mode: response.data.properties.summary.price.mode,
    standardDev: response.data.properties.summary.price.standardDev,
  }

  await github.appendToFile(
    `daily-${category.replace(/_/g, '-')}.csv`,
    `"${start.substr(0, 10)}","${stats.count}","${stats.min}","${stats.max}","${stats.mean}","${stats.median}","${stats.mode}","${stats.standardDev}"`,
    `Daily data: ${start.substr(0, 10)}`
  );

  callback(null, stats);
};
