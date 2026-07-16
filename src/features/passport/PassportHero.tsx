import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { AppText } from "@/components/ui/AppText";
import type { TravelStats } from "@/features/stats/compute";

/**
 * Been-style passport hero card: a vibrant gradient plate with the headline
 * travel numbers. The gradient + decorative orbits are pure SVG so no native
 * modules (expo-linear-gradient) are needed.
 */
export function PassportHero({ stats }: { stats: TravelStats }) {
  return (
    <View className="overflow-hidden rounded-card">
      <Svg width="100%" height="100%" style={{ position: "absolute" }} preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 320">
        <Defs>
          <LinearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FF9142" />
            <Stop offset="0.55" stopColor="#FF6B00" />
            <Stop offset="1" stopColor="#C44A00" />
          </LinearGradient>
        </Defs>
        <Rect width="400" height="320" fill="url(#hero)" />
        {/* Decorative orbit rings */}
        <Circle cx="340" cy="30" r="130" stroke="#FFFFFF" strokeWidth="1" opacity="0.14" fill="none" />
        <Circle cx="340" cy="30" r="90" stroke="#FFFFFF" strokeWidth="1" opacity="0.18" fill="none" />
        <Circle cx="30" cy="300" r="110" stroke="#FFFFFF" strokeWidth="1" opacity="0.12" fill="none" />
        <Circle cx="352" cy="122" r="4" fill="#FFD166" />
        <Circle cx="250" cy="26" r="3" fill="#FFFFFF" opacity="0.5" />
      </Svg>

      <View className="gap-5 p-5">
        {/* Row 1: trips + duration */}
        <View className="flex-row">
          <HeroStat
            className="flex-1"
            icon="airplane"
            label="Trips"
            value={String(stats.completedTrips + stats.upcomingTrips)}
          />
          <HeroStat
            className="flex-1"
            icon="time-outline"
            label="Duration"
            value={stats.tripDaysTotal > 0 ? `${stats.tripDaysTotal}d` : "—"}
          />
        </View>

        {/* Row 2: continents / countries / cities */}
        <View className="flex-row">
          <HeroStat className="flex-1" label="Continents" value={String(stats.continentsVisited)} small />
          <HeroStat className="flex-1" label="Countries" value={String(stats.countriesVisited)} small />
          <HeroStat className="flex-1" label="Cities" value={String(stats.citiesVisited)} small />
        </View>

        {/* World explored strip */}
        <View className="flex-row items-center gap-3 rounded-2xl bg-white/20 px-4 py-3">
          <Ionicons name="earth" size={18} color="#FFFFFF" />
          <AppText className="flex-1 font-sans-semibold text-sm text-white">World explored</AppText>
          <AppText variant="display" className="text-2xl text-white">
            {stats.worldPercent}%
          </AppText>
        </View>
      </View>
    </View>
  );
}

function HeroStat({
  icon,
  label,
  value,
  small,
  className,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  small?: boolean;
  className?: string;
}) {
  return (
    <View className={className}>
      <View className="flex-row items-center gap-1.5">
        {icon ? <Ionicons name={icon} size={14} color="rgba(255,255,255,0.85)" /> : null}
        <AppText className="font-sans-medium text-xs uppercase tracking-wider text-white/80">
          {label}
        </AppText>
      </View>
      <AppText variant="display" className={small ? "mt-0.5 text-3xl text-white" : "mt-0.5 text-5xl text-white"}>
        {value}
      </AppText>
    </View>
  );
}
