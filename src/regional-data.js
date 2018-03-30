'use strict';

const db      = require('./lib/db');
const github  = require('./lib/github');
const typeCast = require('./lib/mysql-typecast').default;
const geojson = {
  riga: require('../data/riga-geojson.json'),
  latvia: require('../data/latvia-geojson.json'),
};
const moment  = require('moment');
const numbers = require('numbers');

export const run = async (event, context, callback) => {
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
  }));

  const stats = {};
  const allPrices = [];
  const connection = await db.connect();

  for (var i = 0; i < regions.length; i++) {
    const region = regions[i];
    console.log(region.name);

    const polygons = region.polygons.map((row) => {
      return `ST_Contains(ST_GeomFromText('POLYGON((${row[0].map((row) => row.join(' ')).join(', ')}))'), point(lng, lat))`;
    }).join(' OR ');

    const [data] = await connection.query({
      sql: `
        SELECT price
        FROM properties
        WHERE published_at BETWEEN ? AND ?
        AND category = ?
        AND type = ?
        AND (${polygons})
      `,

      values: [start, end, category, type],

      typeCast,
    });

    const prices = data.map(({ price }) => price);

    allPrices.push(...prices);

    stats[region.name] = numbers.statistic.median(prices) || 0;
  }

  stats.all = numbers.statistic.median(allPrices) || 0;

  connection.end();

  let csv = [
    start.substr(0, 10),
    end.substr(0, 10),
    stats.all,
    ...Object.keys(stats).filter((key) => key !== 'all').map((key) => stats[key]),
  ].map((row) => `"${row}"`).join(',');

  await github.appendToFile(
    `${category}/${type}-monthly-${activeRegion}.csv`,
    csv,
    `Weekly data (${category}, ${type}, ${activeRegion}): ${start.substr(0, 10)} - ${end.substr(0, 10)}`
  );

  callback(null, stats);
};
