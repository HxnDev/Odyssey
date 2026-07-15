/**
 * Generates bundled geo assets from world-atlas + world-countries:
 *  - assets/geo/countries.geo.json  (GeoJSON polygons keyed by ISO alpha-2, for the map fill layer)
 *  - src/data/countries.json        (reference dataset: names, continents, capitals, flags, centroids)
 *
 * Run: node scripts/generate-geo.js
 */
const fs = require("fs");
const path = require("path");
const topojson = require("topojson-client");
const worldAtlas = require("world-atlas/countries-50m.json");
const worldCountries = require("world-countries");

const byCcn3 = new Map(worldCountries.map((c) => [c.ccn3, c]));

const geo = topojson.feature(worldAtlas, worldAtlas.objects.countries);

const features = [];
let skipped = 0;
for (const f of geo.features) {
  const meta = byCcn3.get(String(f.id).padStart(3, "0"));
  if (!meta || !meta.cca2) {
    skipped++;
    continue;
  }
  features.push({
    type: "Feature",
    id: meta.cca2,
    properties: { iso: meta.cca2, name: meta.name.common },
    geometry: f.geometry,
  });
}

const outGeo = { type: "FeatureCollection", features };
const geoDir = path.join(__dirname, "..", "assets", "geo");
fs.mkdirSync(geoDir, { recursive: true });
fs.writeFileSync(path.join(geoDir, "countries.geo.json"), JSON.stringify(outGeo));

const dataset = worldCountries
  .filter((c) => c.unMember || ["TW", "XK", "PS", "VA", "HK", "MO", "GL", "PR", "FO", "GI", "BM", "KY", "CW", "AW", "PF", "NC", "GU", "IM", "JE", "GG"].includes(c.cca2))
  .map((c) => ({
    iso: c.cca2,
    iso3: c.cca3,
    name: c.name.common,
    officialName: c.name.official,
    continent: c.region === "Americas" ? (c.subregion?.includes("South") ? "South America" : "North America") : c.region,
    subregion: c.subregion ?? null,
    capital: c.capital?.[0] ?? null,
    flag: c.flag,
    lat: c.latlng?.[0] ?? 0,
    lng: c.latlng?.[1] ?? 0,
    area: c.area ?? 0,
    unMember: !!c.unMember,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const dataDir = path.join(__dirname, "..", "src", "data");
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, "countries.json"), JSON.stringify(dataset, null, 1));

console.log(`GeoJSON features: ${features.length} (skipped ${skipped} without ISO)`);
console.log(`Dataset countries: ${dataset.length}`);
console.log(`GeoJSON size: ${(fs.statSync(path.join(geoDir, "countries.geo.json")).size / 1e6).toFixed(2)} MB`);
