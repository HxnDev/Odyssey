/**
 * Generates src/data/cities.json from the GeoNames-derived `all-the-cities`
 * dataset (devDependency). Keeps cities with population >= 5,000 — roughly
 * 49,000 entries — which covers small resort towns (Zermatt, Interlaken, …)
 * that travelers actually log. Stored as compact arrays to keep the bundle
 * lean: [id, name, iso, lat, lng, population, alias?].
 *
 * Run: node scripts/generate-cities.js
 */
const fs = require("fs");
const path = require("path");
const allCities = require("all-the-cities");

const MIN_POPULATION = 5_000;

// English exonyms for cities the dataset stores under their local name.
// [local name, country, English alias]
const ALIASES = [
  ["Genève", "CH", "Geneva"],
  ["Luzern", "CH", "Lucerne"],
  ["Köln", "DE", "Cologne"],
  ["Nürnberg", "DE", "Nuremberg"],
  ["Hannover", "DE", "Hanover"],
  ["Sevilla", "ES", "Seville"],
  ["Göteborg", "SE", "Gothenburg"],
  ["Gent", "BE", "Ghent"],
  ["Brugge", "BE", "Bruges"],
  ["Kyiv", "UA", "Kiev"],
  ["Mumbai", "IN", "Bombay"],
  ["Chennai", "IN", "Madras"],
  ["Kolkata", "IN", "Calcutta"],
];
const aliasByKey = new Map(ALIASES.map(([name, iso, alias]) => [`${name}|${iso}`, alias]));

const cities = allCities
  .filter((c) => c.population >= MIN_POPULATION)
  .sort((a, b) => b.population - a.population)
  .map((c) => {
    const row = [
      c.cityId,
      c.name,
      c.country,
      Math.round(c.loc.coordinates[1] * 1e4) / 1e4,
      Math.round(c.loc.coordinates[0] * 1e4) / 1e4,
      c.population,
    ];
    const alias = aliasByKey.get(`${c.name}|${c.country}`);
    if (alias) row.push(alias);
    return row;
  });

const outPath = path.join(__dirname, "..", "src", "data", "cities.json");
fs.writeFileSync(outPath, JSON.stringify(cities));

console.log(`Cities: ${cities.length}`);
console.log(`Size: ${(fs.statSync(outPath).size / 1e6).toFixed(2)} MB`);
