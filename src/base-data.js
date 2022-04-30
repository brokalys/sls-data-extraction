import github from './lib/github';
import axios from 'axios';
import moment from 'moment';

export const run = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const type = process.env.PROPERTY_TYPE;

  const start = moment.utc().subtract(1, 'day').startOf('day').toISOString();
  const end = moment.utc().subtract(1, 'day').endOf('day').toISOString();

  const { data: response } = await axios.post(
    'https://api.brokalys.com',
    {
      query: `
        query DataExtraction_BaseData($filter: PropertyFilter) {
          properties(
            filter: $filter,
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
      variables: {
        filter: {
          published_at: { gte: start, lte: end },
          type: { eq: type, },
          price: { gte: 1 },
        },
      },
    },
    {
      headers: {
        'x-api-key': process.env.BROKALYS_API_GATEWAY_KEY,
      },
    },
  );

  const summary = response.data ? response.data.properties.summary : { price: {} };

  const stats = {
    count: summary.count || 0,
    min: summary.price.min || 0,
    max: summary.price.max || 0,
    mean: summary.price.mean || 0,
    median: summary.price.median || 0,
    mode: summary.price.mode || 0,
    standardDev: summary.price.standardDev || 0,
  }

  await github.appendToFile(
    `daily-${type.replace(/_/g, '-')}.csv`,
    `"${start.substr(0, 10)}","${stats.count}","${stats.min}","${stats.max}","${stats.mean}","${stats.median}","${stats.mode}","${stats.standardDev}"`,
    `Daily data: ${start.substr(0, 10)}`
  );

  callback(null, stats);
};
