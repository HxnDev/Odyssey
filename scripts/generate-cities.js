/**
 * Generates src/data/cities.json from the GeoNames-derived `all-the-cities`
 * dataset (devDependency). Keeps cities with population >= 50,000 — roughly
 * 9,000 entries (~700 KB) — which covers virtually every city a traveler
 * would log. Smaller places can be added in-app as custom cities.
 *
 * Run: node scripts/generate-cities.js
 */
const fs = require("fs");
const path = require("path");
const allCities = require("all-the-cities");

const MIN_POPULATION = 50_000;

const cities = allCities
  .filter((c) => c.population >= MIN_POPULATION)
  .map((c) => ({
    id: c.cityId,
    name: c.name,
    iso: c.country,
    lat: Math.round(c.loc.coordinates[1] * 1e4) / 1e4,
    lng: Math.round(c.loc.coordinates[0] * 1e4) / 1e4,
    pop: c.population,
  }))
  .sort((a, b) => b.pop - a.pop);

const outPath = path.join(__dirname, "..", "src", "data", "cities.json");
fs.writeFileSync(outPath, JSON.stringify(cities));

console.log(`Cities: ${cities.length}`);
console.log(`Size: ${(fs.statSync(outPath).size / 1e6).toFixed(2)} MB`);
