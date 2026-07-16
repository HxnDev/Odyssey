import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { countryByIso } from "@/features/countries/data";
import type { TripRow } from "@/lib/database.types";
import { daysBetween, formatIso } from "@/lib/dates";
import { transportIcon, transportLabel } from "@/lib/transport";

interface TripCardProps {
  trip: TripRow;
  /** ISO of the trip's (first) destination country, for the flag. */
  countryIso?: string | null;
}

/** Full-bleed flag image (flagcdn, disk-cached) with emoji fallback beneath. */
function FlagBox({ iso, emoji }: { iso?: string | null; emoji: string }) {
  return (
    <View className="h-10 w-[52px] items-center justify-center overflow-hidden rounded-lg bg-paper-sunken dark:bg-paper-dark-sunken">
      <AppText className="text-xl">{emoji}</AppText>
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

export function TripCard({ trip, countryIso }: TripCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const days = daysBetween(trip.start_date, trip.end_date);
  const country = countryIso ? countryByIso.get(countryIso) : null;

  return (
    <Pressable
      onPress={() => router.push(`/trip/${trip.id}`)}
      style={{ elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}
      className="mb-3 overflow-hidden rounded-card bg-paper-raised active:opacity-80 dark:bg-paper-dark-raised"
    >
      <View className="p-4">
        {/* Date row + duration badge */}
        <View className="flex-row items-center justify-between pb-3">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="calendar-clear-outline" size={13} color={colors.inkFaint} />
            <AppText variant="caption" className="font-sans-medium">
              {formatIso(trip.start_date)}
              {trip.end_date && trip.end_date !== trip.start_date ? ` – ${formatIso(trip.end_date)}` : ""}
            </AppText>
          </View>
          {trip.cancelled ? (
            <View className="rounded-chip bg-paper-sunken px-2.5 py-1 dark:bg-paper-dark-sunken">
              <AppText variant="caption" className="font-sans-semibold">
                Cancelled
              </AppText>
            </View>
          ) : days ? (
            <View className="rounded-chip bg-primary-soft px-2.5 py-1 dark:bg-primary-dark-soft">
              <AppText variant="caption" className="font-sans-semibold text-primary-strong dark:text-primary-strong">
                {days} day{days === 1 ? "" : "s"}
              </AppText>
            </View>
          ) : null}
        </View>

        {/* Destination row */}
        <View className="flex-row items-center gap-3">
          <FlagBox iso={countryIso} emoji={trip.cover_emoji} />
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <MaterialCommunityIcons
                name={transportIcon(trip.transport)}
                size={14}
                color={colors.inkFaint}
              />
              <AppText variant="caption">{transportLabel(trip.transport)}</AppText>
            </View>
            <AppText variant="heading" className="text-base" numberOfLines={1}>
              {trip.name}
              {country ? `, ${country.name}` : ""}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
        </View>
      </View>
    </Pressable>
  );
}
