'use strict';

const db      = require('./lib/db');
const github  = require('./lib/github');
const geojson = require('../data/riga-geojson.json');
const moment  = require('moment');
const numbers = require('numbers');

export const run = async (event, context, callback) => {
  const connection = await db.connect();

  const start = moment.utc().subtract(1, 'week').startOf('isoWeek').toISOString();
  const end = moment.utc().subtract(1, 'week').endOf('isoWeek').toISOString();

  const regions = geojson.features.map((feature) => ({
    name: feature.properties.apkaime,
    polygon: feature.geometry.coordinates[0].map((row) => row.join(' ')).join(', '),
  }));

  const type = 'sell';
  const category = 'apartment';

  const stats = {};
  const allPrices = [];

  for (var i = 0; i < regions.length; i++) {
    const region = regions[i];

    const [data] = await connection.query({
      sql: `
        SELECT price
        FROM properties
        WHERE created_at BETWEEN ? AND ?
        AND price >= 1
        AND category = ?
        AND type = ?
        AND ST_Contains(ST_GeomFromText(?), point(lng, lat))
      `,

      values: [start, end, category, type, `POLYGON((${region.polygon}))`],

      typeCast(field, next) {
        if (field.type === 'NEWDECIMAL') {
          return parseFloat(field.string());
        }

        return next();
      },
    });

    const prices = data.map(({ price }) => price);
    allPrices.push(...prices);

    stats[region.name] = parseInt(numbers.statistic.median(prices), 10) || 0;
  }

  stats['Rīga'] = parseInt(numbers.statistic.median(allPrices), 10) || 0;

  connection.end();

  github.appendToFile(
    `${category}/weekly.csv`,
    `"${stats['Rīga']}","${stats['Āgenskalns']}","${stats['Atgāzene']}","${stats['Avoti']}","${stats['Beberbeķi']}","${stats['Berģi']}","${stats['Bieriņi']}","${stats['Bišumuiža']}","${stats['Bolderāja']}","${stats['Brasa']}","${stats['Brekši']}","${stats['Bukulti']}","${stats['Buļļi']}","${stats['Centrs']}","${stats['Čiekurkalns']}","${stats['Daugavgrīva']}","${stats['Dreiliņi']}","${stats['Dzirciems']}","${stats['Dārzciems']}","${stats['Dārziņi']}","${stats['Grīziņkalns']}","${stats['Imanta']}","${stats['Iļģuciems']}","${stats['Jaunciems']}","${stats['Jugla']}","${stats['Katlakalns']}","${stats['Kleisti']}","${stats['Kundziņsala']}","${stats['Ķengarags']}","${stats['Ķīpsala']}","${stats['Mangaļsala']}","${stats['Maskavas forstate']}","${stats['Mežaparks']}","${stats['Mežciems']}","${stats['Mīlgrāvis']}","${stats['Mūkupurvs']}","${stats['Pleskodāle']}","${stats['Purvciems']}","${stats['Pētersala-Andrejsala']}","${stats['Pļavnieki']}","${stats['Rumbula']}","${stats['Salas']}","${stats['Sarkandaugava']}","${stats['Skanste']}","${stats['Šķirotava']}","${stats['Spilve']}","${stats['Suži']}","${stats['Šampēteris']}","${stats['Teika']}","${stats['Torņakalns']}","${stats['Trīsciems']}","${stats['Vecdaugava']}","${stats['Vecmilgrāvis']}","${stats['Vecpilsēta']}","${stats['Vecāķi']}","${stats['Voleri']}","${stats['Zasulauks']}","${stats['Ziepniekkalns']}","${stats['Zolitūde']}"`,
    `Weekly data (${category}, ${type}): ${start} - ${end}`
  );

  callback(null, stats);
};
