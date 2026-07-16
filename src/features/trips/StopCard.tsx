import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { AppText } from "@/components/ui/AppText";
import { CalendarField } from "@/components/ui/CalendarField";
import { countryByIso } from "@/features/countries/data";
import { TransportPicker } from "@/features/trips/TransportPicker";
import { useDeleteTripStop, useUpdateTripStop } from "@/features/trips/queries";
import { useTheme } from "@/hooks/useTheme";
import type { TripStopRow } from "@/lib/database.types";
import { formatIso } from "@/lib/dates";
import { transportIcon } from "@/lib/transport";

interface StopCardProps {
  stop: TripStopRow;
  index: number;
  isLast: boolean;
  /** Single-destination trips: the trip-level dates/transport already cover
   * this stop, so hide the per-stop editors and just allow removal. */
  compact?: boolean;
  onMove: (stop: TripStopRow, direction: -1 | 1) => void;
}

export function StopCard({ stop, index, isLast, compact, onMove }: StopCardProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const updateStop = useUpdateTripStop();
  const deleteStop = useDeleteTripStop();
  const country = countryByIso.get(stop.country_iso);

  const removeStop = () => deleteStop.mutate({ id: stop.id, trip_id: stop.trip_id });

  if (compact) {
    return (
      <View className="rounded-card border border-line bg-paper-raised dark:border-line-dark dark:bg-paper-dark-raised">
        <View className="flex-row items-center gap-3 p-3.5">
          <AppText className="text-2xl">{country?.flag ?? "📍"}</AppText>
          <View className="flex-1">
            <AppText variant="heading" className="text-base" numberOfLines={1}>
              {stop.city_name}
            </AppText>
            <AppText variant="caption">{country?.name ?? stop.country_iso}</AppText>
          </View>
          <Pressable onPress={removeStop} className="p-2" accessibilityLabel="Remove destination">
            <Ionicons name="close" size={18} color={colors.inkFaint} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row gap-3">
      {/* Timeline rail */}
      <View className="items-center">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-primary dark:bg-primary-dark">
          <AppText className="font-sans-bold text-xs text-white dark:text-paper-dark">
            {index + 1}
          </AppText>
        </View>
        {!isLast ? <View className="w-0.5 flex-1 bg-line dark:bg-line-dark" /> : null}
      </View>

      <View className="mb-3 flex-1 rounded-card border border-line bg-paper-raised dark:border-line-dark dark:bg-paper-dark-raised">
        <Pressable onPress={() => setExpanded(!expanded)} className="flex-row items-center gap-3 p-3.5">
          <AppText className="text-2xl">{country?.flag ?? "📍"}</AppText>
          <View className="flex-1">
            <AppText variant="heading" className="text-base" numberOfLines={1}>
              {stop.city_name}
            </AppText>
            <View className="flex-row items-center gap-1.5">
              <AppText variant="caption">
                {country?.name ?? stop.country_iso}
                {stop.arrival_date ? `  ·  ${formatIso(stop.arrival_date)}` : ""}
              </AppText>
              {stop.transport ? (
                <MaterialCommunityIcons
                  name={transportIcon(stop.transport)}
                  size={13}
                  color={colors.inkFaint}
                />
              ) : null}
            </View>
          </View>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.inkFaint} />
        </Pressable>

        {expanded ? (
          <Animated.View entering={FadeIn.duration(150)} className="gap-4 border-t border-line p-3.5 dark:border-line-dark">
            <View className="flex-row gap-3">
              <CalendarField
                label="Arrival"
                value={stop.arrival_date}
                onChange={(value) =>
                  updateStop.mutate({ id: stop.id, trip_id: stop.trip_id, arrival_date: value })
                }
                className="flex-1"
              />
              <CalendarField
                label="Departure"
                value={stop.departure_date}
                onChange={(value) =>
                  updateStop.mutate({ id: stop.id, trip_id: stop.trip_id, departure_date: value })
                }
                className="flex-1"
              />
            </View>

            <View className="gap-1.5">
              <AppText variant="label">Getting there</AppText>
              <TransportPicker
                value={stop.transport}
                allowDeselect
                onChange={(mode) =>
                  updateStop.mutate({ id: stop.id, trip_id: stop.trip_id, transport: mode })
                }
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row gap-1">
                <Pressable
                  onPress={() => onMove(stop, -1)}
                  className="p-2"
                  accessibilityLabel="Move stop up"
                >
                  <Ionicons name="arrow-up" size={18} color={colors.inkSoft} />
                </Pressable>
                <Pressable
                  onPress={() => onMove(stop, 1)}
                  className="p-2"
                  accessibilityLabel="Move stop down"
                >
                  <Ionicons name="arrow-down" size={18} color={colors.inkSoft} />
                </Pressable>
              </View>
              <Pressable
                onPress={removeStop}
                className="flex-row items-center gap-1 p-2"
                accessibilityLabel="Remove stop"
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <AppText variant="caption" className="text-danger dark:text-danger-dark">
                  Remove
                </AppText>
              </Pressable>
            </View>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}
