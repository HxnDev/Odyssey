import {
  Camera,
  GeoJSONSource,
  Layer,
  Map as MapLibreMap,
  type CameraRef,
} from "@maplibre/maplibre-react-native";
import { forwardRef, useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import type { CityVisitRow, CountryVisitRow } from "@/lib/database.types";
import { buildCityPoints, labelPoints, worldGeoJson } from "./geometry";
import { buildFillColorExpression } from "./expressions";
import { buildBaseStyle, MAP_FONT } from "./mapStyle";

export type MapViewMode = "countries" | "cities";

export interface WorldMapProps {
  visits: CountryVisitRow[];
  selectedIso: string | null;
  onCountryPress: (iso: string) => void;
  /** "countries" paints fills; "cities" fades fills and shows visited-city dots. */
  mode?: MapViewMode;
  cityVisits?: CityVisitRow[];
  onCityPress?: (id: string) => void;
}

export const WorldMap = forwardRef<CameraRef, WorldMapProps>(function WorldMap(
  { visits, selectedIso, onCountryPress, mode = "countries", cityVisits = [], onCityPress },
  cameraRef,
) {
  const { scheme, colors } = useTheme();

  const baseStyle = useMemo(() => buildBaseStyle(scheme), [scheme]);
  const fillColor = useMemo(() => buildFillColorExpression(visits, scheme), [visits, scheme]);

  const cityPoints = useMemo(() => buildCityPoints(cityVisits), [cityVisits]);

  return (
    <MapLibreMap
      // Remount on theme change: swapping mapStyle in place makes MapLibre
      // reload the style while the React-managed layers race it, leaving the
      // map half-themed. A fresh native view rebuilds everything atomically.
      key={scheme}
      style={StyleSheet.absoluteFill}
      mapStyle={baseStyle}
      touchRotate={false}
      touchPitch={false}
      attribution={false}
      logo={false}
      compass={false}
    >
      <Camera
        ref={cameraRef}
        initialViewState={{ center: [22, 33], zoom: 1.7 }}
        minZoom={0.8}
        maxZoom={9}
      />

      <GeoJSONSource
        id="countries"
        data={worldGeoJson}
        onPress={(event) => {
          const iso = event.nativeEvent.features?.[0]?.properties?.iso;
          if (typeof iso === "string") onCountryPress(iso);
        }}
      >
        <Layer
          id="country-fills"
          type="fill"
          paint={{
            "fill-color": fillColor as never,
            // Cities mode fades the country fills so the dots stand out.
            "fill-opacity": mode === "cities" ? 0.3 : 1,
          }}
        />
        <Layer
          id="country-borders"
          type="line"
          paint={{
            "line-color": colors.border,
            "line-width": 0.6,
            "line-opacity": 0.8,
          }}
        />
        <Layer
          id="country-selected-outline"
          type="line"
          filter={["==", ["get", "iso"], selectedIso ?? "__none__"]}
          paint={{
            "line-color": colors.coral,
            "line-width": 2.5,
          }}
        />
      </GeoJSONSource>

      {mode === "cities" ? (
        <GeoJSONSource
          id="city-dots-src"
          data={cityPoints}
          onPress={(event) => {
            const id = event.nativeEvent.features?.[0]?.properties?.id;
            if (typeof id === "string") onCityPress?.(id);
          }}
        >
          <Layer
            id="city-dots"
            type="circle"
            paint={{
              "circle-color": colors.primary,
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 3, 4, 5, 8, 8],
              "circle-stroke-color": colors.paper,
              "circle-stroke-width": 1.5,
            }}
          />
        </GeoJSONSource>
      ) : null}

      <GeoJSONSource id="country-labels-src" data={labelPoints}>
        <Layer
          id="country-labels"
          type="symbol"
          layout={{
            "text-field": ["get", "name"],
            "text-font": [MAP_FONT],
            "text-size": ["interpolate", ["linear"], ["zoom"], 0.8, 10, 3, 12.5, 5, 15, 8, 19],
            "text-max-width": 7,
            "text-padding": 4,
            "text-letter-spacing": 0.04,
            "symbol-sort-key": ["-", 0, ["get", "area"]],
          }}
          paint={{
            "text-color": colors.mapLabel,
            "text-halo-color": colors.ocean,
            "text-halo-width": 1.2,
          }}
        />
      </GeoJSONSource>
    </MapLibreMap>
  );
});
