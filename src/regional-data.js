import connection from './lib/db';
import github from './lib/github';
import typeCast from './lib/mysql-typecast';
import moment from 'moment';
import numbers from 'numbers';
import inside from 'point-in-polygon';

const geojson = {
  riga: require('../data/riga-geojson.json'),
  latvia: require('../data/latvia-geojson.json'),
};

export const run = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const type = process.env.PROPERTY_TYPE;
  const category = process.env.PROPERTY_CATEGORY;
  const activeRegion = process.env.REGION;

  const start = moment.utc().subtract(1, 'month').startOf('month').toISOString();
  const end = moment.utc().subtract(1, 'month').endOf('month').toISOString();

  const regions = geojson[activeRegion].features.map((feature) => ({
    name: feature.properties.apkaime,
    polygons: feature.geometry.coordinates,
  })).map((feature) => ({
    name: feature.name,
    polygons: activeRegion === 'riga' ? [feature.polygons] : feature.polygons,
    prices: [],
  }));

  const stats = {};
  const allPrices = [];

  const data = await connection.query({
    sql: `
      SELECT price, lat, lng
      FROM properties
      WHERE published_at BETWEEN ? AND ?
      AND category = ?
      AND type = ?
      AND lat IS NOT NULL
      AND lng IS NOT NULL
      AND location_country = "Latvia"
      AND price > 1
      ${ type === 'rent' ? 'AND (rent_type IS NULL OR rent_type = "monthly")' : '' }
    `,

    values: [start, end, category, type],
    typeCast,
  });
  connection.end();

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
