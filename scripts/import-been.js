/**
 * Imports a Been "Data export" text file into Odyssey's Supabase tables.
 *
 * Usage:
 *   SUPABASE_SECRET_KEY=sb_secret_... node scripts/import-been.js ~/Downloads/been-data-export.txt
 *
 * - Countries  → country_visits (status "visited", dates/days derived from trips)
 * - Cities     → city_visits (visit counts + dates derived from trips)
 * - Trips      → trips + one trip_stop each. Entries whose dates touch are
 *                clustered into a shared group_name (e.g. "Japan · Apr 2026"),
 *                which the app renders as one big trip.
 *
 * Idempotent: country/city rows are upserted or skipped, trips are skipped
 * when an identical name + start date already exists.
 */

/* global __dirname */

const fs = require("fs");
const path = require("path");

const countries = require("../src/data/countries.json");
const cities = require("../src/data/cities.json");

const SUPABASE_URL = (process.env.SUPABASE_URL || readEnvFile("EXPO_PUBLIC_SUPABASE_URL") || "").replace(/\/$/, "");
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const EXPORT_PATH = process.argv[2] || path.join(process.env.HOME, "Downloads/been-data-export.txt");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COUNTRY_ALIASES = {
  "czech republic": "CZ",
  turkey: "TR",
  "united states": "US",
  "south korea": "KR",
  russia: "RU",
  vietnam: "VN",
};
const TRANSPORT_MAP = { ship: "boat", ferry: "boat", foot: "walk", bike: "bicycle" };
const TRANSPORT_EMOJI = {
  plane: "✈️", train: "🚆", car: "🚗", bus: "🚌", boat: "🛳️",
  motorcycle: "🏍️", bicycle: "🚲", walk: "🥾",
};

function readEnvFile(key) {
  try {
    const env = fs.readFileSync(path.join(__dirname, "../.env"), "utf8");
    const line = env.split("\n").find((l) => l.startsWith(`${key}=`));
    return line ? line.slice(key.length + 1).trim() : null;
  } catch {
    return null;
  }
}

const countryByName = new Map();
for (const c of countries) {
  countryByName.set(c.name.toLowerCase(), c.iso);
  countryByName.set(c.officialName.toLowerCase(), c.iso);
}
function isoFor(name) {
  const key = name.trim().toLowerCase();
  return COUNTRY_ALIASES[key] || countryByName.get(key) || null;
}

const cityIndex = new Map(); // "name|ISO" -> city record
for (const c of cities) {
  cityIndex.set(`${c.name.toLowerCase()}|${c.iso}`, c);
}

function inclusiveDays(start, end) {
  const ms = new Date(`${end}T00:00:00Z`) - new Date(`${start}T00:00:00Z`);
  return Math.round(ms / 86_400_000) + 1;
}
function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---------- Parse the export ----------

function parseExport(text) {
  const lines = text.split("\n").map((l) => l.trimEnd());
  const visitedCountries = [];
  const visitedCities = [];
  const entries = [];
  let section = null;

  for (const line of lines) {
    if (/^COUNTRIES VISITED/.test(line)) { section = "countries"; continue; }
    if (/^CITIES VISITED/.test(line)) { section = "cities"; continue; }
    if (/^TRIPS/.test(line)) { section = "trips"; continue; }
    if (!line.trim() || line.startsWith("---") || line.startsWith("BEEN") || line.startsWith("Generated")) continue;

    if (section === "countries") visitedCountries.push(line.trim());
    else if (section === "cities") visitedCities.push(line.trim());
    else if (section === "trips") {
      const m = line.match(/^(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})\s+(.+?)\s+\((\w+)\)$/);
      if (!m) { console.warn(`  ! Unparsed trip line: "${line}"`); continue; }
      const [, start, end, place, rawTransport] = m;
      const commaIdx = place.lastIndexOf(",");
      let cityName, countryName;
      if (commaIdx === -1) {
        cityName = place.trim();
        countryName = place.trim(); // e.g. "Luxembourg" (city-state style entry)
      } else {
        cityName = place.slice(0, commaIdx).trim();
        countryName = place.slice(commaIdx + 1).trim();
      }
      const transport = TRANSPORT_MAP[rawTransport] || rawTransport;
      entries.push({ start, end, cityName, countryName, transport });
    }
  }
  return { visitedCountries, visitedCities, entries };
}

// ---------- Cluster contiguous entries into trip groups ----------

function clusterEntries(entries) {
  const sorted = [...entries].sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
  const clusters = [];
  let current = null;
  for (const entry of sorted) {
    if (current && entry.start <= addDays(current.end, 1)) {
      current.entries.push(entry);
      if (entry.end > current.end) current.end = entry.end;
    } else {
      current = { start: entry.start, end: entry.end, entries: [entry] };
      clusters.push(current);
    }
  }

  for (const cluster of clusters) {
    if (cluster.entries.length < 2) continue;
    // Dominant country (by days) names the group: "Japan · Apr 2026"
    const daysByCountry = new Map();
    for (const e of cluster.entries) {
      const iso = isoFor(e.countryName);
      daysByCountry.set(iso, (daysByCountry.get(iso) || 0) + inclusiveDays(e.start, e.end));
    }
    const dominantIso = [...daysByCountry.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const dominant = countries.find((c) => c.iso === dominantIso);
    const startDate = new Date(`${cluster.start}T00:00:00Z`);
    cluster.groupName = `${dominant ? dominant.name : "Trip"} · ${MONTHS[startDate.getUTCMonth()]} ${startDate.getUTCFullYear()}`;
  }
  return clusters;
}

// ---------- Supabase REST helpers ----------

async function rest(pathname, { method = "GET", body, prefer } = {}) {
  const res = await fetch(`${SUPABASE_URL}${pathname}`, {
    method,
    headers: {
      apikey: SECRET_KEY,
      Authorization: `Bearer ${SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${pathname} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  const text = fs.readFileSync(EXPORT_PATH, "utf8");
  const { visitedCountries, visitedCities, entries } = parseExport(text);
  console.log(`Parsed: ${visitedCountries.length} countries, ${visitedCities.length} cities, ${entries.length} trip entries`);

  if (DRY_RUN) {
    for (const name of visitedCountries) {
      if (!isoFor(name)) console.warn(`  ! Unmatched country: "${name}"`);
    }
    const clusters = clusterEntries(entries);
    const grouped = clusters.filter((c) => c.groupName);
    console.log(`Clusters: ${clusters.length} (${grouped.length} multi-stop groups)`);
    for (const c of grouped) {
      console.log(`  ${c.groupName}: ${c.entries.length} trips, ${c.start} → ${c.end}`);
      for (const e of c.entries) console.log(`      ${e.start}..${e.end}  ${e.cityName} (${isoFor(e.countryName) ?? "??"}, ${e.transport})`);
    }
    console.log("Dry run complete — nothing written.");
    return;
  }

  if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL (set env var or .env EXPO_PUBLIC_SUPABASE_URL)");
  if (!SECRET_KEY) throw new Error("Missing SUPABASE_SECRET_KEY env var (sb_secret_...)");

  // Schema probe: trip grouping needs migration 0003.
  try {
    await rest("/rest/v1/trips?select=group_name,flight_number&limit=1");
  } catch {
    throw new Error(
      "The trips table is missing group_name/flight_number.\n" +
      "Run supabase/migrations/0003_trip_groups_flights.sql in the Supabase SQL editor first, then re-run this script.",
    );
  }

  // Resolve the (single) user.
  const users = await rest("/auth/v1/admin/users");
  const user = (users.users || users)[0];
  if (!user?.id) throw new Error("No user found in Supabase auth");
  console.log(`Importing for user: ${user.email} (${user.id})`);
  const userId = user.id;

  // Warn about unmatched country names before writing anything.
  for (const name of visitedCountries) {
    if (!isoFor(name)) console.warn(`  ! Unmatched country: "${name}" — skipped`);
  }

  const clusters = clusterEntries(entries);
  const grouped = clusters.filter((c) => c.groupName);
  console.log(`Clustered ${entries.length} entries into ${clusters.length} trips/groups (${grouped.length} multi-stop groups)`);

  // Per-country + per-city stats derived from trip entries.
  const countryStats = new Map(); // iso -> {first,last,days,visits}
  const cityStats = new Map(); // "name|ISO" -> {first,last,days,count}
  for (const cluster of clusters) {
    const isosInCluster = new Set();
    for (const e of cluster.entries) {
      const iso = isoFor(e.countryName);
      if (!iso) continue;
      isosInCluster.add(iso);
      const days = inclusiveDays(e.start, e.end);
      const cs = countryStats.get(iso) || { first: e.start, last: e.end, days: 0, visits: 0 };
      cs.first = e.start < cs.first ? e.start : cs.first;
      cs.last = e.end > cs.last ? e.end : cs.last;
      cs.days += days;
      countryStats.set(iso, cs);

      const key = `${e.cityName.toLowerCase()}|${iso}`;
      const st = cityStats.get(key) || { name: e.cityName, iso, first: e.start, last: e.end, days: 0, count: 0 };
      st.first = e.start < st.first ? e.start : st.first;
      st.last = e.end > st.last ? e.end : st.last;
      st.days += days;
      st.count += 1;
      cityStats.set(key, st);
    }
    for (const iso of isosInCluster) countryStats.get(iso).visits += 1;
  }

  // 1) Country visits (upsert on user_id+country_iso).
  const countryRows = visitedCountries
    .map((name) => {
      const iso = isoFor(name);
      if (!iso) return null;
      const st = countryStats.get(iso);
      return {
        user_id: userId,
        country_iso: iso,
        status: "visited",
        first_visit_date: st?.first ?? null,
        last_visit_date: st?.last ?? null,
        total_days: st?.days ?? null,
        visit_count: Math.max(st?.visits ?? 1, 1),
      };
    })
    .filter(Boolean);
  await rest("/rest/v1/country_visits?on_conflict=user_id,country_iso", {
    method: "POST",
    body: countryRows,
    prefer: "resolution=merge-duplicates,return=minimal",
  });
  console.log(`Upserted ${countryRows.length} country visits`);

  // 2) City visits (skip ones that already exist).
  const existingCities = await rest(`/rest/v1/city_visits?select=name,country_iso&user_id=eq.${userId}`);
  const existingCityKeys = new Set(existingCities.map((c) => `${c.name.toLowerCase()}|${c.country_iso}`));
  const cityRows = [];
  for (const line of visitedCities) {
    const commaIdx = line.lastIndexOf(",");
    const cityName = commaIdx === -1 ? line.trim() : line.slice(0, commaIdx).trim();
    const countryName = commaIdx === -1 ? line.trim() : line.slice(commaIdx + 1).trim();
    const iso = isoFor(countryName);
    if (!iso) { console.warn(`  ! Unmatched city country: "${line}" — skipped`); continue; }
    const key = `${cityName.toLowerCase()}|${iso}`;
    if (existingCityKeys.has(key)) continue;
    const bundled = cityIndex.get(key);
    const st = cityStats.get(key);
    cityRows.push({
      user_id: userId,
      city_id: bundled?.id ?? null,
      name: cityName,
      country_iso: iso,
      lat: bundled?.lat ?? null,
      lng: bundled?.lng ?? null,
      first_visit_date: st?.first ?? null,
      last_visit_date: st?.last ?? null,
      total_days: st?.days ?? null,
      visit_count: Math.max(st?.count ?? 1, 1),
    });
  }
  if (cityRows.length) {
    await rest("/rest/v1/city_visits", { method: "POST", body: cityRows, prefer: "return=minimal" });
  }
  console.log(`Inserted ${cityRows.length} city visits (${existingCityKeys.size} already existed)`);

  // 3) Trips + stops (skip name+start_date duplicates).
  const existingTrips = await rest(`/rest/v1/trips?select=name,start_date&user_id=eq.${userId}`);
  const existingTripKeys = new Set(existingTrips.map((t) => `${t.name}|${t.start_date}`));
  let tripCount = 0;
  for (const cluster of clusters) {
    for (const e of cluster.entries) {
      const iso = isoFor(e.countryName);
      if (!iso) continue;
      if (existingTripKeys.has(`${e.cityName}|${e.start}`)) continue;
      const [trip] = await rest("/rest/v1/trips", {
        method: "POST",
        body: {
          user_id: userId,
          name: e.cityName,
          transport: e.transport,
          start_date: e.start,
          end_date: e.end,
          cover_emoji: TRANSPORT_EMOJI[e.transport] || "🧳",
          group_name: cluster.groupName ?? null,
          notes: "Imported from Been",
        },
        prefer: "return=representation",
      });
      const bundled = cityIndex.get(`${e.cityName.toLowerCase()}|${iso}`);
      await rest("/rest/v1/trip_stops", {
        method: "POST",
        body: {
          user_id: userId,
          trip_id: trip.id,
          position: 0,
          city_name: e.cityName,
          country_iso: iso,
          lat: bundled?.lat ?? null,
          lng: bundled?.lng ?? null,
          arrival_date: e.start,
          departure_date: e.end,
          transport: e.transport,
        },
        prefer: "return=minimal",
      });
      tripCount += 1;
    }
  }
  console.log(`Inserted ${tripCount} trips with stops`);
  console.log("Done ✔");
}

main().catch((err) => {
  console.error(`\nImport failed: ${err.message}`);
  process.exit(1);
});
