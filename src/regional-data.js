'use strict';

const db      = require('./lib/db');
const github  = require('./lib/github');
const typeCast = require('./lib/mysql-typecast').default;
const geojson = require('../data/riga-geojson.json');
const moment  = require('moment');
const numbers = require('numbers');

export const run = async (event, context, callback) => {
  const type = process.env.PROPERTY_TYPE;
  const category = process.env.PROPERTY_CATEGORY;

  const start = moment.utc().subtract(1, 'month').startOf('month').toISOString();
  const end = moment.utc().subtract(1, 'month').endOf('month').toISOString();

  const regions = geojson.features.map((feature) => ({
    name: feature.properties.apkaime,
    polygon: feature.geometry.coordinates[0].map((row) => row.join(' ')).join(', '),
  }));

  const stats = {};
  const allPrices = [];
  const connection = await db.connect();

  for (var i = 0; i < regions.length; i++) {
    const region = regions[i];

    const [data] = await connection.query({
      sql: `
        SELECT price
        FROM properties
        WHERE published_at BETWEEN ? AND ?
        AND category = ?
        AND type = ?
        AND ST_Contains(ST_GeomFromText(?), point(lng, lat))
      `,

      values: [start, end, category, type, `POLYGON((${region.polygon}))`],

      typeCast,
    });

    const prices = data.map(({ price }) => price);

    allPrices.push(...prices);

    stats[region.name] = numbers.statistic.median(prices) || 0;
  }

  stats['Rīga'] = numbers.statistic.median(allPrices) || 0;

  connection.end();

  await github.appendToFile(
    `${category}/${type}-monthly.csv`,
    `"${start.substr(0, 10)}","${end.substr(0, 10)}","${stats['Rīga']}","${stats['Āgenskalns']}","${stats['Atgāzene']}","${stats['Avoti']}","${stats['Beberbeķi']}","${stats['Berģi']}","${stats['Bieriņi']}","${stats['Bišumuiža']}","${stats['Bolderāja']}","${stats['Brasa']}","${stats['Brekši']}","${stats['Bukulti']}","${stats['Buļļi']}","${stats['Centrs']}","${stats['Čiekurkalns']}","${stats['Daugavgrīva']}","${stats['Dreiliņi']}","${stats['Dzirciems']}","${stats['Dārzciems']}","${stats['Dārziņi']}","${stats['Grīziņkalns']}","${stats['Imanta']}","${stats['Iļģuciems']}","${stats['Jaunciems']}","${stats['Jugla']}","${stats['Katlakalns']}","${stats['Kleisti']}","${stats['Kundziņsala']}","${stats['Ķengarags']}","${stats['Ķīpsala']}","${stats['Mangaļsala']}","${stats['Maskavas forstate']}","${stats['Mežaparks']}","${stats['Mežciems']}","${stats['Mīlgrāvis']}","${stats['Mūkupurvs']}","${stats['Pleskodāle']}","${stats['Purvciems']}","${stats['Pētersala-Andrejsala']}","${stats['Pļavnieki']}","${stats['Rumbula']}","${stats['Salas']}","${stats['Sarkandaugava']}","${stats['Skanste']}","${stats['Šķirotava']}","${stats['Spilve']}","${stats['Suži']}","${stats['Šampēteris']}","${stats['Teika']}","${stats['Torņakalns']}","${stats['Trīsciems']}","${stats['Vecdaugava']}","${stats['Vecmilgrāvis']}","${stats['Vecpilsēta']}","${stats['Vecāķi']}","${stats['Voleri']}","${stats['Zasulauks']}","${stats['Ziepniekkalns']}","${stats['Zolitūde']}"`,
    `Weekly data (${category}, ${type}): ${start.substr(0, 10)} - ${end.substr(0, 10)}`
  );

  callback(null, stats);
};
