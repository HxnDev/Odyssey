/**
 * Generates src/data/airports.json — a compact IATA → [city, utcOffset] map
 * used to auto-fill city names and compute layover durations across
 * timezones. Offsets are OpenFlights' standard-time UTC offsets (DST-naive,
 * so layovers spanning a DST switch can be off by an hour — acceptable).
 *
 * Source: OpenFlights airports database (public domain-ish, ~7k airports).
 * Run: node scripts/generate-airports.js
 */
/* global __dirname */
const fs = require("fs");
const path = require("path");
const https = require("https");

const URL =
  "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat";

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

// airports.dat is CSV with quoted fields:
// id,"Name","City","Country","IATA","ICAO",lat,lng,...
function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else current += ch;
  }
  fields.push(current);
  return fields;
}

(async () => {
  const csv = await fetchText(URL);
  const map = {};
  let count = 0;
  for (const line of csv.split("\n")) {
    if (!line.trim()) continue;
    const f = parseCsvLine(line);
    const [, name, city, , iata, , , , , offsetRaw] = f;
    if (!iata || iata === "\\N" || !/^[A-Z]{3}$/.test(iata)) continue;
    const offset = Number.parseFloat(offsetRaw);
    map[iata] = [
      city && city !== "\\N" ? city : name,
      Number.isFinite(offset) ? offset : null,
    ];
    count++;
  }

  const outPath = path.join(__dirname, "..", "src", "data", "airports.json");
  fs.writeFileSync(outPath, JSON.stringify(map));
  console.log(`Airports: ${count}`);
  console.log(`Size: ${(fs.statSync(outPath).size / 1024).toFixed(0)} KB`);
})();
