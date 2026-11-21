import { Camera, GeoJSONSource, Layer, Map as MapLibreMap } from "@maplibre/maplibre-react-native";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import type { CountryVisitRow } from "@/lib/database.types";
import { buildFillColorExpression } from "@/features/map/expressions";
import { buildBaseStyle } from "@/features/map/mapStyle";
import { worldGeoJson } from "@/features/map/geometry";

/**
 * Non-interactive world map preview for the passport screen — the "where have
 * I been" postcard. All gestures are disabled; the parent decides what a tap
 * does (usually jump to the Map tab).
 */
export function MiniWorldMap({ visits, height = 190 }: { visits: CountryVisitRow[]; height?: number }) {
  const { scheme } = useTheme();
  const baseStyle = useMemo(() => buildBaseStyle(scheme), [scheme]);
  const fillColor = useMemo(() => buildFillColorExpression(visits, scheme), [visits, scheme]);
  const { colors } = useTheme();

  return (
    <View style={{ height }} pointerEvents="none" className="overflow-hidden rounded-2xl">
      <MapLibreMap
        key={scheme}
        style={StyleSheet.absoluteFill}
        mapStyle={baseStyle}
        dragPan={false}
        touchZoom={false}
        doubleTapZoom={false}
        touchRotate={false}
        touchPitch={false}
        attribution={false}
        logo={false}
        compass={false}
      >
        {/* Android's minimum zoom is 0; negative values throw Mbgl-Transform errors. */}
        <Camera initialViewState={{ center: [12, 22], zoom: 0 }} minZoom={0} />
        <GeoJSONSource id="mini-countries" data={worldGeoJson}>
          <Layer
            id="mini-country-fills"
            type="fill"
            paint={{ "fill-color": fillColor as never, "fill-opacity": 1 }}
          />
          <Layer
            id="mini-country-borders"
            type="line"
            paint={{ "line-color": colors.border, "line-width": 0.4, "line-opacity": 0.7 }}
          />
        </GeoJSONSource>
      </MapLibreMap>
    </View>
  );
}
