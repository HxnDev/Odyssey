import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { countryByIso } from "@/features/countries/data";
import type { TripRow } from "@/lib/database.types";
import { daysBetween, formatRange } from "@/lib/dates";
import { transportIcon, transportLabel } from "@/lib/transport";

interface TripCardProps {
  trip: TripRow;
  /** ISO of the trip's (first) destination country, for the flag. */
  countryIso?: string | null;
  /** Rendered instead of the chevron (drag handle inside expanded groups). */
  dragHandle?: React.ReactNode;
}

/** Flag image (flagcdn, disk-cached) with emoji fallback beneath. */
function FlagBox({ iso, emoji }: { iso?: string | null; emoji: string }) {
  return (
    <View className="h-8 w-11 items-center justify-center overflow-hidden rounded-md bg-paper-sunken dark:bg-paper-dark-sunken">
      <AppText className="text-base">{emoji}</AppText>
      {iso ? (
        <Image
          source={{ uri: `https://flagcdn.com/w160/${iso.toLowerCase()}.png` }}
          style={{ position: "absolute", width: "100%", height: "100%" }}
          contentFit="cover"
          cachePolicy="disk"
          transition={100}
        />
      ) : null}
    </View>
  );
}

export function TripCard({ trip, countryIso, dragHandle }: TripCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const days = daysBetween(trip.start_date, trip.end_date);
  const country = countryIso ? countryByIso.get(countryIso) : null;

  return (
    <Pressable
      onPress={() => router.push(`/trip/${trip.id}`)}
      className="mb-3 overflow-hidden rounded-card bg-paper-raised active:opacity-80 dark:bg-paper-dark-raised"
      style={{ elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
    >
      {/* Date row + duration */}
      <View className="flex-row items-center justify-between px-4 pb-2.5 pt-3">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="calendar-clear-outline" size={12} color={colors.inkFaint} />
          <AppText variant="caption" className="text-[13px]">
            {formatRange(trip.start_date, trip.end_date)}
          </AppText>
        </View>
        {trip.cancelled ? (
          <AppText variant="caption" className="text-[13px]">
            Cancelled
          </AppText>
        ) : days ? (
          <AppText variant="caption" className="text-[13px]">
            Duration{" "}
            <AppText variant="caption" className="font-sans-semibold text-[13px] text-primary-strong dark:text-primary-dark">
              {days} day{days === 1 ? "" : "s"}
            </AppText>
          </AppText>
        ) : null}
      </View>

      <View className="h-px bg-line dark:bg-line-dark" />

      {/* Destination row */}
      <View className="flex-row items-center gap-3 px-4 py-3">
        <FlagBox iso={countryIso} emoji={trip.cover_emoji} />
        <View className="flex-1 gap-0.5">
          <View className="flex-row items-center gap-1.5">
            <MaterialCommunityIcons
              name={transportIcon(trip.transport)}
              size={13}
              color={colors.inkFaint}
            />
            <AppText variant="caption">{transportLabel(trip.transport)}</AppText>
          </View>
          <AppText className="font-sans-medium text-[16px] text-ink dark:text-ink-dark" numberOfLines={1}>
            {trip.name}
            {country ? `, ${country.name}` : ""}
          </AppText>
        </View>
        {dragHandle ?? <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />}
      </View>
    </Pressable>
  );
}
