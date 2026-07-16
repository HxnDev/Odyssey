import citiesJson from "@/data/cities.json";

export interface CityRecord {
  id: number;
  name: string;
  iso: string;
  lat: number;
  lng: number;
  pop: number;
}

/** Bundled GeoNames cities with population >= 50k, sorted by population desc. */
export const cities: CityRecord[] = citiesJson as CityRecord[];

/**
 * Search bundled cities by name, optionally scoped to a country.
 * Results are already population-sorted, so the biggest matches come first.
 */
export function searchCities(query: string, countryIso?: string, limit = 12): CityRecord[] {
  const q = query.trim().toLowerCase();
  const results: CityRecord[] = [];
  for (const city of cities) {
    if (countryIso && city.iso !== countryIso) continue;
    if (q && !city.name.toLowerCase().includes(q)) continue;
    results.push(city);
    if (results.length >= limit) break;
  }
  return results;
}
