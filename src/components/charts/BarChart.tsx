import { useState } from "react";
import { View } from "react-native";
import Svg, { G, Rect, Text as SvgText } from "react-native-svg";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { fonts } from "@/lib/theme";

export interface BarDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
  color?: string;
}

/** Lightweight themed bar chart (react-native-svg, no chart library). */
export function BarChart({ data, height = 160, color }: BarChartProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const barColor = color ?? colors.primary;

  const max = Math.max(...data.map((d) => d.value), 1);
  const labelHeight = 22;
  const valueHeight = 16;
  const chartHeight = height - labelHeight - valueHeight;
  const gap = 8;
  const barWidth = width > 0 ? Math.max((width - gap * (data.length - 1)) / data.length, 4) : 0;

  if (data.length === 0) {
    return (
      <View style={{ height }} className="items-center justify-center">
        <AppText variant="caption">No data yet</AppText>
      </View>
    );
  }

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {data.map((d, i) => {
            const barH = Math.max((d.value / max) * chartHeight, d.value > 0 ? 4 : 0);
            const x = i * (barWidth + gap);
            const y = valueHeight + (chartHeight - barH);
            return (
              <G key={d.label}>
                {d.value > 0 && (
                  <SvgText
                    x={x + barWidth / 2}
                    y={y - 5}
                    fontSize={11}
                    fontFamily={fonts.sansMedium}
                    fill={colors.inkSoft}
                    textAnchor="middle"
                  >
                    {d.value}
                  </SvgText>
                )}
                <Rect x={x} y={y} width={barWidth} height={barH} rx={5} fill={barColor} opacity={0.9} />
                <SvgText
                  x={x + barWidth / 2}
                  y={height - 6}
                  fontSize={11}
                  fontFamily={fonts.sans}
                  fill={colors.inkFaint}
                  textAnchor="middle"
                >
                  {d.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}
