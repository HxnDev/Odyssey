import { View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  centerTitle?: string;
  centerSubtitle?: string;
}

/** Themed donut chart with a legend (react-native-svg, no chart library). */
export function DonutChart({
  data,
  size = 150,
  strokeWidth = 18,
  centerTitle,
  centerSubtitle,
}: DonutChartProps) {
  const { colors } = useTheme();
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offsetAccumulator = 0;

  return (
    <View className="flex-row items-center gap-5">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <G rotation={-90} originX={size / 2} originY={size / 2}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={colors.paperSunken}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {total > 0 &&
              data
                .filter((d) => d.value > 0)
                .map((d) => {
                  const fraction = d.value / total;
                  const dash = fraction * circumference;
                  const element = (
                    <Circle
                      key={d.label}
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke={d.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${dash} ${circumference - dash}`}
                      strokeDashoffset={-offsetAccumulator}
                      strokeLinecap="butt"
                      fill="none"
                    />
                  );
                  offsetAccumulator += dash;
                  return element;
                })}
          </G>
        </Svg>
        <View className="absolute inset-0 items-center justify-center">
          {centerTitle ? (
            <AppText variant="title" className="text-xl">
              {centerTitle}
            </AppText>
          ) : null}
          {centerSubtitle ? <AppText variant="caption">{centerSubtitle}</AppText> : null}
        </View>
      </View>

      <View className="flex-1 gap-1.5">
        {data.map((d) => (
          <View key={d.label} className="flex-row items-center gap-2">
            <View className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
            <AppText variant="caption" className="flex-1" numberOfLines={1}>
              {d.label}
            </AppText>
            <AppText variant="caption" className="font-sans-semibold">
              {d.value}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}
