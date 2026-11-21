import type { CameraRef } from "@maplibre/maplibre-react-native";
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent,
} from "react";
import { countryByIso } from "@/features/countries/data";
import { useTheme } from "@/hooks/useTheme";
import { statusColors, type CountryStatus } from "@/lib/theme";
import { buildCityPoints, worldGeoJson } from "./geometry";
import type { WorldMapProps } from "./WorldMap";
import "./BrowserMap.web.css";

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const MIN_VIEW_WIDTH = 95;

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BrowserMapProps extends WorldMapProps {
  interactive?: boolean;
}

function project([longitude, latitude]: number[]) {
  return [
    ((longitude + 180) / 360) * MAP_WIDTH,
    ((90 - latitude) / 180) * MAP_HEIGHT,
  ] as const;
}

function ringPath(ring: number[][]) {
  if (ring.length === 0) return "";
  return `${ring
    .map((point, index) => {
      const [x, y] = project(point);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ")} Z`;
}

function geometryPath(geometry: GeoJSON.Geometry | null) {
  if (!geometry) return "";
  if (geometry.type === "Polygon") return geometry.coordinates.map(ringPath).join(" ");
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flatMap((polygon) => polygon.map(ringPath)).join(" ");
  }
  return "";
}

function clampViewBox(viewBox: ViewBox): ViewBox {
  const width = Math.min(MAP_WIDTH, Math.max(MIN_VIEW_WIDTH, viewBox.width));
  const height = width / 2;
  return {
    x: Math.min(MAP_WIDTH - width, Math.max(0, viewBox.x)),
    y: Math.min(MAP_HEIGHT - height, Math.max(0, viewBox.y)),
    width,
    height,
  };
}

export const BrowserMap = forwardRef<Pick<CameraRef, "flyTo">, BrowserMapProps>(
  function BrowserMap(
    {
      interactive = true,
      visits,
      selectedIso,
      onCountryPress,
      mode = "countries",
      cityVisits = [],
      onCityPress,
    },
    ref,
  ) {
    const { colors, scheme } = useTheme();
    const [viewBox, setViewBox] = useState<ViewBox>({
      x: 0,
      y: 0,
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
    });
    const drag = useRef<{ x: number; y: number; viewBox: ViewBox } | null>(null);

    const countryPaths = useMemo(
      () =>
        worldGeoJson.features.flatMap((feature) => {
          const iso = feature.properties?.iso;
          if (typeof iso !== "string" || iso === "AQ") return [];
          return [{ iso, path: geometryPath(feature.geometry) }];
        }),
      [],
    );
    const visitByIso = useMemo(
      () => new Map(visits.map((visit) => [visit.country_iso, visit.status as CountryStatus])),
      [visits],
    );
    const cityPoints = useMemo(() => buildCityPoints(cityVisits), [cityVisits]);
    const visibleLabels = useMemo(
      () =>
        [...countryByIso.values()].filter(
          (country) => country.area >= 900_000 && country.iso !== "AQ",
        ),
      [],
    );

    const zoomAt = (
      factor: number,
      centerX = viewBox.x + viewBox.width / 2,
      centerY = viewBox.y + viewBox.height / 2,
    ) => {
      setViewBox((current) => {
        const width = current.width * factor;
        const height = width / 2;
        const relativeX = (centerX - current.x) / current.width;
        const relativeY = (centerY - current.y) / current.height;
        return clampViewBox({
          x: centerX - width * relativeX,
          y: centerY - height * relativeY,
          width,
          height,
        });
      });
    };

    useImperativeHandle(
      ref,
      () => ({
        flyTo: async ({ center, zoom }) => {
          if (!center) return;
          const [x, y] = project(center);
          const factor = Math.max(1, 1.55 ** Math.max(0, (zoom ?? 1.7) - 1.7));
          const width = MAP_WIDTH / factor;
          const height = width / 2;
          setViewBox(clampViewBox({ x: x - width / 2, y: y - height / 2, width, height }));
        },
      }),
      [],
    );

    const onWheel = (event: WheelEvent<SVGSVGElement>) => {
      if (!interactive) return;
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      const x = viewBox.x + ((event.clientX - rect.left) / rect.width) * viewBox.width;
      const y = viewBox.y + ((event.clientY - rect.top) / rect.height) * viewBox.height;
      zoomAt(event.deltaY > 0 ? 1.18 : 0.84, x, y);
    };

    const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
      if (!interactive) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { x: event.clientX, y: event.clientY, viewBox };
    };

    const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
      if (!interactive || !drag.current) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const deltaX = ((event.clientX - drag.current.x) / rect.width) * drag.current.viewBox.width;
      const deltaY = ((event.clientY - drag.current.y) / rect.height) * drag.current.viewBox.height;
      setViewBox(
        clampViewBox({
          ...drag.current.viewBox,
          x: drag.current.viewBox.x - deltaX,
          y: drag.current.viewBox.y - deltaY,
        }),
      );
    };

    const stopDragging = () => {
      drag.current = null;
    };

    return (
      <div className="odyssey-browser-map" style={{ backgroundColor: colors.ocean }}>
        <svg
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          preserveAspectRatio="xMidYMid slice"
          role={interactive ? "application" : "img"}
          aria-label="World travel map"
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onPointerLeave={stopDragging}
        >
          <g className="odyssey-map-grid" stroke={colors.line}>
            {[-120, -60, 0, 60, 120].map((longitude) => {
              const [x] = project([longitude, 0]);
              return <line key={`lng-${longitude}`} x1={x} y1={0} x2={x} y2={MAP_HEIGHT} />;
            })}
            {[-60, -30, 0, 30, 60].map((latitude) => {
              const [, y] = project([0, latitude]);
              return <line key={`lat-${latitude}`} x1={0} y1={y} x2={MAP_WIDTH} y2={y} />;
            })}
          </g>

          <g className="odyssey-map-countries">
            {countryPaths.map(({ iso, path }) => {
              const status = visitByIso.get(iso);
              const fill = status ? statusColors[status][scheme] : colors.landUnvisited;
              return (
                <path
                  key={iso}
                  d={path}
                  fill={fill}
                  fillOpacity={mode === "cities" ? 0.38 : 1}
                  fillRule="evenodd"
                  stroke={selectedIso === iso ? colors.coral : colors.border}
                  strokeWidth={selectedIso === iso ? 2.2 : 0.55}
                  vectorEffect="non-scaling-stroke"
                  onClick={(event) => {
                    if (!interactive || mode !== "countries") return;
                    event.stopPropagation();
                    onCountryPress(iso);
                  }}
                />
              );
            })}
          </g>

          {mode === "countries" && viewBox.width > 260 && (
            <g className="odyssey-map-labels" fill={colors.mapLabel}>
              {visibleLabels.map((country) => {
                const [x, y] = project([country.lng, country.lat]);
                return (
                  <text key={country.iso} x={x} y={y} textAnchor="middle">
                    {country.name}
                  </text>
                );
              })}
            </g>
          )}

          {mode === "cities" && (
            <g className="odyssey-map-cities">
              {cityPoints.features.map((feature) => {
                if (feature.geometry.type !== "Point") return null;
                const [x, y] = project(feature.geometry.coordinates as number[]);
                const id = feature.properties?.id;
                if (typeof id !== "string") return null;
                return (
                  <circle
                    key={id}
                    cx={x}
                    cy={y}
                    r={Math.max(2.5, viewBox.width / 180)}
                    fill={colors.primary}
                    stroke={colors.paper}
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                    onClick={(event) => {
                      event.stopPropagation();
                      onCityPress?.(id);
                    }}
                  />
                );
              })}
            </g>
          )}
        </svg>

        {interactive && (
          <div className="odyssey-map-zoom" aria-label="Map zoom controls">
            <button type="button" aria-label="Zoom in" onClick={() => zoomAt(0.78)}>
              +
            </button>
            <button type="button" aria-label="Zoom out" onClick={() => zoomAt(1.28)}>
              &minus;
            </button>
          </div>
        )}
      </div>
    );
  },
);
