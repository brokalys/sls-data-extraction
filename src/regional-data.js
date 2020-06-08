import { riga } from '@brokalys/location-json-schemas';
import axios from 'axios';
import moment from 'moment';
import numbers from 'numbers';
import inside from 'point-in-polygon';

import github from './lib/github';

const geojson = {
  riga,
  latvia: require('../data/latvia-geojson.json'),
};

export const run = async (event, context, callback) => {
  const type = process.env.PROPERTY_TYPE;
  const category = process.env.PROPERTY_CATEGORY;
  const activeRegion = process.env.REGION;

  const start = moment.utc().subtract(1, 'month').startOf('month').toISOString();
  const end = moment.utc().subtract(1, 'month').endOf('month').toISOString();

  const regions = geojson[activeRegion].features.map((feature) => ({
    name: feature.properties.name,
    polygons: feature.geometry.coordinates,
  })).map((feature) => ({
    name: feature.name,
    polygons: activeRegion === 'riga' ? [feature.polygons] : feature.polygons,
    prices: [],
  }));

  const stats = {};
  const allPrices = [];

  const { data: response } = await axios.post(
    'https://api.brokalys.com',
    {
      query: `
        {
          properties(
            filter: {
              created_at: { gte: "${start}", lte: "${end}" }
              category: { eq: "${category}" }
              type: { eq: "${type}" }
              ${type === 'rent' ? 'rent_type: { in: ["monthly", "unknown"] }' : ''}
              price: { gte: 1 }
            },
            limit: null
          ) {
            results {
              price
              lat
              lng
            }
          }
        }
      `,
    },
    {
      headers: {
        'x-api-key': process.env.BROKALYS_API_GATEWAY_KEY,
      },
    },
  );
  const data = response.data.properties.results;

  data.forEach((row) => {
    regions.map((region) => {
      var isInside = region.polygons
        .find((polygon) => inside([row.lng, row.lat], polygon[0]));

      if (isInside) {
        region.prices.push(row.price);
      }

      return region;
    });
  });

  regions.forEach(({ name, prices }) => {
    allPrices.push(...prices);

    stats[name] = numbers.statistic.median(prices) || 0;
  });

  stats.all = numbers.statistic.median(allPrices) || 0;

  let csv = [
    start.substr(0, 10),
    end.substr(0, 10),
    stats.all,
    ...Object.keys(stats).filter((key) => key !== 'all').map((key) => stats[key]),
  ].map((row) => `"${row}"`).join(',');

  await github.appendToFile(
    `${category}/${type}-monthly-${activeRegion}.csv`,
    csv,
    `Monthly data (${category}, ${type}, ${activeRegion}): ${start.substr(0, 10)} - ${end.substr(0, 10)}`
  );

  callback(null, stats);
};
