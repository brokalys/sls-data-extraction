'use strict';

const db      = require('./lib/db');
const github  = require('./lib/github');
const geojson = {
  riga: require('../data/riga-geojson.json'),
  latvia: require('../data/latvia-geojson.json'),
};
const moment  = require('moment');
const numbers = require('numbers');

export const run = async (event, context, callback) => {
  const type = process.env.PROPERTY_TYPE;
  const category = process.env.PROPERTY_CATEGORY;

  const start = moment.utc().subtract(3, 'month').startOf('month').toISOString();
  const end = moment.utc().subtract(3, 'month').endOf('month').toISOString();

  const regions = geojson[process.env.REGION].features.map((feature) => ({
    name: feature.properties.apkaime,
    polygons: feature.geometry.coordinates[0],
  }));

  const stats = {};
  const allPrices = [];
  const connection = await db.connect();

  for (var i = 0; i < regions.length; i++) {
    const region = regions[i];
    console.log(region.name);

    const polygons = region.polygons.splice(0,1).map((row) => row.map((row) => row.join(' ')).join(', ')).map((row) => `ST_Contains(ST_GeomFromText('POLYGON((${row}))'), point(lng, lat))`).join(' OR ');

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

      typeCast(field, next) {
        if (field.type === 'NEWDECIMAL') {
          return parseFloat(field.string());
        }

        return next();
      },
    });

    const prices = data.map(({ price }) => price);
    allPrices.push(...prices);

    stats[region.name] = numbers.statistic.median(prices) || 0;
  }

  stats.all = numbers.statistic.median(allPrices) || 0;

  connection.end();

  let row = [
    start.substr(0, 10),
    end.substr(0, 10),
    stats.all,
    ...Object.keys(stats).filter((key) => key !== 'all').map((key) => stats[key]),
  ].map((row) => `"${row}"`).join(',');

  github.appendToFile(
    `${category}/${type}-monthly-${process.env.REGION}.csv`,
    row,
    `Monthly data (${category}, ${type}, ${process.env.REGION}): ${start.substr(0, 10)} - ${end.substr(0, 10)}`,
  );

  callback(null, stats);
};
