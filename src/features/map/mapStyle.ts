import { palette, type ColorScheme } from "@/lib/theme";

/**
 * Self-contained MapLibre style: no external tile servers, no API keys.
 * The world is rendered entirely from the bundled country polygons, which
 * gives a clean atlas look and works offline. Layers for country fills are
 * added as React components on top of this base.
 */
export function buildBaseStyle(scheme: ColorScheme): string {
  const colors = palette[scheme];
  return JSON.stringify({
    version: 8,
    name: `odyssey-${scheme}`,
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": colors.ocean },
      },
    ],
  });
}
