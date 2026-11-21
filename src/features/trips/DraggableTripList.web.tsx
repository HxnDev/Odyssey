import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { TripCard } from "./TripCard";
import type { DraggableTripListProps } from "./DraggableTripList";

export function DraggableTripList({ trips, countryByTrip, onReorder }: DraggableTripListProps) {
  const { colors } = useTheme();

  function move(from: number, to: number) {
    const ids = trips.map(({ id }) => id);
    [ids[from], ids[to]] = [ids[to], ids[from]];
    onReorder(ids);
  }

  return (
    <View>
      {trips.map((trip, index) => (
        <View key={trip.id} className="relative">
          <TripCard trip={trip} countryIso={countryByTrip.get(trip.id)} dragHandle={<View className="w-16" />} />
          {trips.length > 1 && (
            <View pointerEvents="box-none" className="absolute bottom-3 right-4 flex-row items-center pb-1.5">
              {([-1, 1] as const).map((direction) => {
                const target = index + direction;
                const disabled = target < 0 || target >= trips.length;
                return (
                  <Pressable
                    key={direction}
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${trip.name} ${direction < 0 ? "up" : "down"}`}
                    disabled={disabled}
                    onPress={() => move(index, target)}
                    className="p-2"
                  >
                    <Ionicons name={direction < 0 ? "chevron-up" : "chevron-down"} size={18} color={disabled ? colors.inkFaint : colors.ink} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
