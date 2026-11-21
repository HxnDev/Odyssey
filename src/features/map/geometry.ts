import { countries } from "@/features/countries/data";
import type { CityVisitRow } from "@/lib/database.types";

// Bundled world polygons (Natural Earth 1:50m via world-atlas, keyed by ISO alpha-2).
export const worldGeoJson = require("@/assets/geo/countries.geo.json") as GeoJSON.FeatureCollection;

// One label point per country, placed at its centroid. Larger countries get
// their names earlier (lower zoom) via symbol-sort-key + collision detection.
export const labelPoints: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: countries.map((c) => ({
    type: "Feature",
    properties: { iso: c.iso, name: c.name, area: c.area },
    geometry: { type: "Point", coordinates: [c.lng, c.lat] },
  })),
};

export function buildCityPoints(visits: CityVisitRow[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: visits.flatMap(({ id, name, lat, lng }) =>
      lat == null || lng == null ? [] : [{
        type: "Feature",
        properties: { id, name },
        geometry: { type: "Point", coordinates: [lng, lat] },
      }],
    ),
  };
}
