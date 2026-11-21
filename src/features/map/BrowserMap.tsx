import { Map as MapLibreMap, NavigationControl, type StyleSpecification, type GeoJSONSource, type ExpressionSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { CameraRef } from "@maplibre/maplibre-react-native";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import type { ColorScheme } from "@/lib/theme";
import { palette } from "@/lib/theme";
import { buildFillColorExpression } from "./expressions";
import { buildCityPoints, labelPoints, worldGeoJson } from "./geometry";
import { buildBaseStyle, MAP_FONT } from "./mapStyle";
import type { WorldMapProps } from "./WorldMap";

function makeStyle(scheme: ColorScheme, interactive: boolean): StyleSpecification {
  const style: StyleSpecification = JSON.parse(buildBaseStyle(scheme));
  const colors = palette[scheme];
  style.sources.countries = { type: "geojson", data: worldGeoJson };
  style.layers.push(
    { id: "country-fills", type: "fill", source: "countries", paint: { "fill-color": colors.landUnvisited } },
    { id: "country-borders", type: "line", source: "countries", paint: { "line-color": colors.border, "line-width": interactive ? 0.6 : 0.4, "line-opacity": 0.8 } },
  );
  if (interactive) {
    style.sources.cities = { type: "geojson", data: buildCityPoints([]) };
    style.sources.labels = { type: "geojson", data: labelPoints };
    style.layers.push(
      {
        id: "country-selected-outline", type: "line", source: "countries",
        filter: ["==", ["get", "iso"], "__none__"],
        paint: { "line-color": colors.coral, "line-width": 2.5 },
      },
      {
        id: "city-dots", type: "circle", source: "cities", layout: { visibility: "none" },
        paint: {
          "circle-color": colors.primary,
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 3, 4, 5, 8, 8],
          "circle-stroke-color": colors.paper,
          "circle-stroke-width": 1.5,
        },
      },
      {
        id: "country-labels", type: "symbol", source: "labels",
        layout: {
          "text-field": ["get", "name"],
          "text-font": [MAP_FONT],
          "text-size": ["interpolate", ["linear"], ["zoom"], 0.8, 10, 3, 12.5, 5, 15, 8, 19],
          "text-max-width": 7,
          "text-padding": 4,
          "text-letter-spacing": 0.04,
          "symbol-sort-key": ["-", 0, ["get", "area"]],
        },
        paint: { "text-color": colors.mapLabel, "text-halo-color": colors.ocean, "text-halo-width": 1.2 },
      },
    );
  }
  return style;
}

interface BrowserMapProps extends WorldMapProps {
  interactive?: boolean;
}

export const BrowserMap = forwardRef<Pick<CameraRef, "flyTo">, BrowserMapProps>(
  function BrowserMap({ interactive = true, ...props }, ref) {
    const { colors, scheme } = useTheme();
    const container = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreMap>(null);
    const [loadedMap, setLoadedMap] = useState<MapLibreMap | null>(null);
    const [unavailable, setUnavailable] = useState(false);
    const { visits, mode = "countries", selectedIso, cityVisits, onCityPress, onCountryPress } = props;

    useImperativeHandle(ref, () => ({
      flyTo: async ({ center, zoom, duration }) => {
        if (center) mapRef.current?.flyTo({ center, zoom, duration });
      },
    }), []);

    useEffect(() => {
      if (!container.current) return;
      let map: MapLibreMap;
      try {
        map = new MapLibreMap({
          container: container.current,
          style: makeStyle(scheme, interactive),
          canvasContextAttributes: { failIfMajorPerformanceCaveat: false },
          center: interactive ? [22, 33] : [12, 22],
          zoom: interactive ? 1.7 : 0,
          minZoom: interactive ? 0.8 : 0,
          maxZoom: 9,
          interactive,
          dragRotate: false,
          touchPitch: false,
          attributionControl: false,
        });
      } catch {
        setUnavailable(true);
        return;
      }
      setUnavailable(false);
      mapRef.current = map;
      if (interactive) {
        map.touchZoomRotate.disableRotation();
        map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
      }
      map.once("load", () => setLoadedMap(map));
      const observer = new ResizeObserver(() => map.resize());
      observer.observe(container.current);
      return () => {
        observer.disconnect();
        mapRef.current = null;
        map.remove();
      };
    }, [interactive, scheme]);

    useEffect(() => {
      if (!loadedMap || loadedMap !== mapRef.current) return;
      const fill = buildFillColorExpression(visits, scheme) as string | ExpressionSpecification;
      loadedMap.setPaintProperty("country-fills", "fill-color", fill);
      if (interactive) {
        loadedMap.setPaintProperty("country-fills", "fill-opacity", mode === "cities" ? 0.3 : 1);
        loadedMap.setFilter("country-selected-outline", ["==", ["get", "iso"], selectedIso ?? "__none__"]);
        loadedMap.setLayoutProperty("city-dots", "visibility", mode === "cities" ? "visible" : "none");
        loadedMap.getSource<GeoJSONSource>("cities")?.setData(buildCityPoints(cityVisits ?? []));
      }
    }, [loadedMap, visits, scheme, interactive, mode, selectedIso, cityVisits]);

    useEffect(() => {
      if (!interactive || !loadedMap || loadedMap !== mapRef.current) return;
      const layer = mode === "cities" ? "city-dots" : "country-fills";
      const click = loadedMap.on("click", layer, (event) => {
        const properties = event.features?.[0]?.properties;
        if (mode === "cities" && typeof properties?.id === "string") onCityPress?.(properties.id);
        if (mode === "countries" && typeof properties?.iso === "string") onCountryPress(properties.iso);
      });
      const enter = loadedMap.on("mouseenter", layer, () => { loadedMap.getCanvas().style.cursor = "pointer"; });
      const leave = loadedMap.on("mouseleave", layer, () => { loadedMap.getCanvas().style.cursor = ""; });
      return () => {
        click.unsubscribe();
        enter.unsubscribe();
        leave.unsubscribe();
        loadedMap.getCanvas().style.cursor = "";
      };
    }, [interactive, loadedMap, mode, onCityPress, onCountryPress]);

    return (
      <div style={{ position: "absolute", inset: 0, background: colors.ocean }}>
        <div ref={container} style={{ position: "absolute", inset: 0 }} aria-label="World travel map" />
        {unavailable && interactive && (
          <p role="status" style={{ position: "absolute", top: "40%", width: "100%", textAlign: "center", color: colors.ink }}>
            The map is unavailable. Search for a country to explore it.
          </p>
        )}
      </div>
    );
  },
);
