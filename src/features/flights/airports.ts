import airportsJson from "@/data/airports.json";

/**
 * Bundled OpenFlights IATA → [city, utcOffsetHours] map (~6k airports,
 * offline). Offsets are standard-time (DST-naive).
 */
const airports = airportsJson as unknown as Record<string, [string, number | null]>;

export function cityForIata(code: string): string | null {
  return airports[code.trim().toUpperCase()]?.[0] ?? null;
}

export function utcOffsetForIata(code: string): number | null {
  return airports[code.trim().toUpperCase()]?.[1] ?? null;
}
