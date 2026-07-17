import citiesJson from "@/data/cities.json";
import { countries } from "@/features/countries/data";

export interface CityRecord {
  id: number;
  name: string;
  iso: string;
  lat: number;
  lng: number;
  pop: number;
  /** English exonym when it differs from the local name (e.g. Genève → Geneva). */
  alias?: string;
}

type CityTuple = [number, string, string, number, number, number, string?];

/** Bundled GeoNames cities with population >= 5k, sorted by population desc. */
export const cities: CityRecord[] = (citiesJson as CityTuple[]).map(
  ([id, name, iso, lat, lng, pop, alias]) => ({ id, name, iso, lat, lng, pop, alias }),
);

/** Lowercase + strip diacritics, so "zurich" matches "Zürich". */
function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Lazily built on first search to keep app startup fast.
let foldedNames: string[] | null = null;
let countryIsosByFoldedName: [string, string][] | null = null;

function ensureIndexes() {
  foldedNames ??= cities.map((c) => (c.alias ? `${fold(c.name)}\n${fold(c.alias)}` : fold(c.name)));
  countryIsosByFoldedName ??= countries.map((c) => [fold(c.name), c.iso]);
}

function matchesPrefix(foldedName: string, q: string): boolean {
  // The alias, if any, sits after a \n — so startsWith covers the name and
  // "\n<q>" covers the alias.
  return foldedName.startsWith(q) || foldedName.includes(`\n${q}`);
}

/**
 * Search bundled cities by name, optionally scoped to a country.
 * Accent-insensitive; name-prefix matches rank above substring matches,
 * population-sorted within each tier. A query matching a country name
 * (e.g. "Switzerland") also returns that country's biggest cities.
 */
export function searchCities(query: string, countryIso?: string, limit = 20): CityRecord[] {
  ensureIndexes();
  const q = fold(query.trim());

  const prefix: CityRecord[] = [];
  const substring: CityRecord[] = [];
  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    if (countryIso && city.iso !== countryIso) continue;
    if (!q) {
      prefix.push(city);
      if (prefix.length >= limit) break;
      continue;
    }
    const name = foldedNames![i];
    if (matchesPrefix(name, q)) {
      prefix.push(city);
      if (prefix.length >= limit) break;
    } else if (substring.length < limit && name.includes(q)) {
      substring.push(city);
    }
  }

  const results = [...prefix, ...substring];

  // "Switzerland" (or a prefix of it) → biggest Swiss cities.
  if (q.length >= 3 && !countryIso && results.length < limit) {
    const matchedIsos = new Set(
      countryIsosByFoldedName!
        .filter(([name]) => name.startsWith(q) || name.includes(` ${q}`))
        .map(([, iso]) => iso),
    );
    if (matchedIsos.size > 0) {
      const seen = new Set(results.map((c) => c.id));
      for (const city of cities) {
        if (!matchedIsos.has(city.iso) || seen.has(city.id)) continue;
        results.push(city);
        if (results.length >= limit) break;
      }
    }
  }

  return results.slice(0, limit);
}
