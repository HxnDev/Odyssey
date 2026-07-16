import { View } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Path,
  Polygon,
  Rect,
  Text as SvgText,
  TextPath,
  TSpan,
} from "react-native-svg";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import type { Country } from "@/features/countries/data";
import { fonts } from "@/lib/theme";
import type { CountryStatus } from "@/lib/theme";
import { formatIso } from "@/lib/dates";
import { landmarkFor } from "./landmarks";

/**
 * Procedurally generated retro passport stamps: rosette / perforated / hex
 * borders, aged ink-tint paper, arched "WELCOME TO <COUNTRY>" text, landmark
 * art, ink speckles and a dashed date box — in the spirit of Been's
 * illustrated stamps. Deterministic per country, pure SVG.
 */

// Classic stamp-pad ink colors; picked per country by hash so a passport page
// looks like it was stamped at many different border posts.
const INKS = [
  "#B33630", // border-post red
  "#2E7D54", // customs green
  "#2B4C8C", // navy
  "#D95B00", // odyssey burnt orange
  "#8A6116", // ochre
  "#1F7A8C", // petrol
] as const;

function hashIso(iso: string): number {
  let h = 0;
  for (let i = 0; i < iso.length; i++) h = (h * 31 + iso.charCodeAt(i)) >>> 0;
  return h;
}

/** Point on a circle; angle in degrees, 270 = top of the screen. */
function pt(c: number, r: number, angleDeg: number): [number, number] {
  const a = (angleDeg * Math.PI) / 180;
  return [c + r * Math.cos(a), c + r * Math.sin(a)];
}

function arcPath(c: number, r: number, from: number, to: number, sweep: 0 | 1): string {
  const [x1, y1] = pt(c, r, from);
  const [x2, y2] = pt(c, r, to);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 ${sweep} ${x2} ${y2}`;
}

/** Scalloped rosette outline: n petal arcs bulging outward from radius r. */
function rosettePath(c: number, r: number, petals: number): string {
  const step = 360 / petals;
  const petalR = (Math.PI * r) / petals * 0.72;
  let d = `M ${pt(c, r, 0).join(" ")}`;
  for (let i = 1; i <= petals; i++) {
    d += ` A ${petalR} ${petalR} 0 0 1 ${pt(c, r, i * step).join(" ")}`;
  }
  return `${d} Z`;
}

interface StampProps {
  country: Country;
  status: CountryStatus | null;
  date?: string | null;
  size?: number;
}

export function Stamp({ country, status, date, size = 112 }: StampProps) {
  const { colors } = useTheme();
  const hash = hashIso(country.iso);
  const earned = status !== null;
  const ink = earned ? INKS[hash % INKS.length] : colors.inkFaint;
  const rotation = ((hash >> 3) % 17) - 8; // -8°..+8°
  const shape = (hash >> 6) % 3; // 0 rosette · 1 perforated circle · 2 hex

  const c = size / 2;
  const welcome = `WELCOME TO ${country.name.toUpperCase()}`;
  // Long headlines need smaller arched type to fit the ring.
  const welcomeSize =
    welcome.length > 26 ? size * 0.052 : welcome.length > 20 ? size * 0.06 : size * 0.068;
  const capital = (country.capital ?? country.name).toUpperCase();
  const dateLabel = earned && date ? formatIso(date).toUpperCase() : earned ? "ADMITTED" : "· · ·";

  const outerR = c - 3;
  const ringR = c - 9;
  const innerR = c - 27 * (size / 112);
  const textR = (ringR + innerR) / 2 + 0.5;

  // Deterministic ink speckles for a worn, hand-stamped feel.
  const speckles = Array.from({ length: 7 }, (_, i) => {
    const a = ((hash >> (i * 3)) % 360) + i * 47;
    const r = innerR * (0.35 + ((hash >> (i * 2)) % 50) / 90);
    const [x, y] = pt(c, r, a);
    return { x, y, r: 0.6 + ((hash >> i) % 3) * 0.3 };
  });

  const border = (() => {
    switch (shape) {
      case 0:
        return (
          <>
            <Path d={rosettePath(c, outerR - 2, 22)} stroke={ink} strokeWidth={1.8} fill="none" />
            <Circle cx={c} cy={c} r={ringR} stroke={ink} strokeWidth={2} fill="none" />
          </>
        );
      case 1:
        return (
          <>
            <Circle
              cx={c}
              cy={c}
              r={outerR}
              stroke={ink}
              strokeWidth={2.6}
              strokeDasharray={`0.1 ${(2 * Math.PI * outerR) / 36 - 0.1}`}
              strokeLinecap="round"
              fill="none"
            />
            <Circle cx={c} cy={c} r={ringR} stroke={ink} strokeWidth={2} fill="none" />
          </>
        );
      default:
        return (
          <>
            <Polygon
              points={Array.from({ length: 6 }, (_, i) => pt(c, outerR - 1, 60 * i + 30).join(",")).join(" ")}
              stroke={ink}
              strokeWidth={2.5}
              fill="none"
            />
            <Polygon
              points={Array.from({ length: 6 }, (_, i) => pt(c, outerR - 6, 60 * i + 30).join(",")).join(" ")}
              stroke={ink}
              strokeWidth={1}
              fill="none"
              opacity={0.8}
            />
          </>
        );
    }
  })();

  return (
    <View style={{ width: size, alignItems: "center", opacity: earned ? 1 : 0.4 }}>
      <Svg width={size} height={size}>
        <Defs>
          <Path id={`top-${country.iso}`} d={arcPath(c, textR, 178, 2, 1)} />
          <Path id={`bottom-${country.iso}`} d={arcPath(c, textR + 1, 158, 22, 0)} />
        </Defs>

        <G rotation={rotation} originX={c} originY={c}>
          {/* Aged ink-tint paper */}
          <Circle cx={c} cy={c} r={ringR} fill={ink} opacity={0.07} />
          {border}
          <Circle cx={c} cy={c} r={innerR} stroke={ink} strokeWidth={1} fill="none" opacity={0.85} />
          <Circle
            cx={c}
            cy={c}
            r={innerR - 2.5}
            stroke={ink}
            strokeWidth={0.7}
            strokeDasharray="2 2.5"
            fill="none"
            opacity={0.55}
          />

          {/* Arched "WELCOME TO <COUNTRY>" across the top of the ring band */}
          <SvgText fill={ink} fontSize={welcomeSize} fontFamily={fonts.sansBold} letterSpacing={0.6}>
            <TextPath href={`#top-${country.iso}`} startOffset="50%">
              <TSpan textAnchor="middle">{welcome}</TSpan>
            </TextPath>
          </SvgText>
          {/* Capital arched along the bottom, like "PRAGUE · PRAGUE CASTLE" */}
          <SvgText fill={ink} fontSize={size * 0.058} fontFamily={fonts.sansSemibold} letterSpacing={1}>
            <TextPath href={`#bottom-${country.iso}`} startOffset="50%">
              <TSpan textAnchor="middle">{`· ${capital} ·`}</TSpan>
            </TextPath>
          </SvgText>

          {/* Side diamonds separating the two arcs */}
          {([178, 2] as const).map((angle) => {
            const [x, y] = pt(c, textR, angle);
            return (
              <Rect
                key={angle}
                x={x - 2}
                y={y - 2}
                width={4}
                height={4}
                fill={ink}
                transform={`rotate(45 ${x} ${y})`}
              />
            );
          })}

          {/* Center: landmark illustration, flag and date */}
          <SvgText x={c} y={c + size * 0.02} fontSize={size * 0.24} textAnchor="middle">
            {landmarkFor(country.iso, country.continent)}
          </SvgText>
          <SvgText x={c} y={c + size * 0.14} fontSize={size * 0.085} textAnchor="middle">
            {country.flag}
          </SvgText>
          <Rect
            x={c - size * 0.19}
            y={c + size * 0.165}
            width={size * 0.38}
            height={size * 0.1}
            rx={2}
            stroke={ink}
            strokeWidth={0.8}
            strokeDasharray="2.5 2"
            fill="none"
            opacity={0.9}
          />
          <SvgText
            x={c}
            y={c + size * 0.238}
            fontSize={size * 0.055}
            fontFamily={fonts.sansBold}
            fill={ink}
            textAnchor="middle"
            letterSpacing={0.5}
          >
            {dateLabel}
          </SvgText>

          {/* Ink speckles */}
          {earned
            ? speckles.map((s, i) => (
                <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill={ink} opacity={0.35} />
              ))
            : null}
        </G>
      </Svg>
      <View className="mt-1.5 items-center">
        <AppText variant="caption" numberOfLines={1} style={{ maxWidth: size }}>
          {country.name}
        </AppText>
      </View>
    </View>
  );
}
