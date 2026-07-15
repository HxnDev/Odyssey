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
import type { CountryVisitRow } from "@/lib/database.types";
import { buildFillColorExpression } from "./expressions";
import { buildBaseStyle } from "./mapStyle";

// Bundled world polygons (Natural Earth 1:50m via world-atlas, keyed by ISO alpha-2).
const worldGeoJson = require("@/assets/geo/countries.geo.json") as GeoJSON.FeatureCollection;

interface WorldMapProps {
  visits: CountryVisitRow[];
  selectedIso: string | null;
  onCountryPress: (iso: string) => void;
}

export const WorldMap = forwardRef<CameraRef, WorldMapProps>(function WorldMap(
  { visits, selectedIso, onCountryPress },
  cameraRef,
) {
  const { scheme, colors } = useTheme();

  const baseStyle = useMemo(() => buildBaseStyle(scheme), [scheme]);
  const fillColor = useMemo(() => buildFillColorExpression(visits, scheme), [visits, scheme]);

  return (
    <MapLibreMap
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
        initialViewState={{ center: [10, 25], zoom: 0.8 }}
        minZoom={0.3}
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
            "fill-opacity": 1,
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
            "line-color": colors.terracotta,
            "line-width": 2.5,
          }}
        />
      </GeoJSONSource>
    </MapLibreMap>
  );
});
