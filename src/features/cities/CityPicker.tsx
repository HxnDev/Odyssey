import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { fonts } from "@/lib/theme";
import { countryByIso } from "@/features/countries/data";
import { searchCities, type CityRecord } from "./data";

export interface PickedCity {
  cityId: number | null;
  name: string;
  iso: string;
  lat: number | null;
  lng: number | null;
}

interface CityPickerProps {
  visible: boolean;
  onClose: () => void;
  onPick: (city: PickedCity) => void;
  /** Scope search to one country (e.g. from the country detail page). */
  countryIso?: string;
  title?: string;
}

/** Modal city search over the bundled dataset, with custom-city fallback. */
export function CityPicker({ visible, onClose, onPick, countryIso, title = "Add city" }: CityPickerProps) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchCities(query, countryIso), [query, countryIso]);
  const trimmed = query.trim();

  const pick = (city: CityRecord) => {
    onPick({ cityId: city.id, name: city.name, iso: city.iso, lat: city.lat, lng: city.lng });
    setQuery("");
    onClose();
  };

  const pickCustom = () => {
    if (!trimmed || !countryIso) return;
    onPick({ cityId: null, name: trimmed, iso: countryIso, lat: null, lng: null });
    setQuery("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(150)} className="flex-1 bg-black/40 pt-24">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <Animated.View
          entering={FadeInDown.duration(250).springify()}
          className="mx-4 max-h-[70%] rounded-card border border-line bg-paper-raised p-4 dark:border-line-dark dark:bg-paper-dark-raised"
        >
          <View className="mb-3 flex-row items-center justify-between">
            <AppText variant="title" className="text-xl">
              {title}
            </AppText>
            <Pressable onPress={onClose} className="p-1" accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={colors.inkSoft} />
            </Pressable>
          </View>

          <View className="mb-3 flex-row items-center gap-2 rounded-2xl border border-line bg-paper px-4 dark:border-line-dark dark:bg-paper-dark">
            <Ionicons name="search" size={18} color={colors.inkFaint} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder={countryIso ? `Search cities in ${countryByIso.get(countryIso)?.name ?? countryIso}` : "Search cities"}
              placeholderTextColor={colors.inkFaint}
              style={{ fontFamily: fonts.sans, color: colors.ink }}
              className="h-12 flex-1 text-base"
            />
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const country = countryByIso.get(item.iso);
              return (
                <Pressable
                  onPress={() => pick(item)}
                  className="flex-row items-center gap-3 border-b border-line py-3 dark:border-line-dark"
                >
                  <AppText className="text-xl">{country?.flag ?? "🏙️"}</AppText>
                  <View className="flex-1">
                    <AppText variant="heading" className="text-base">
                      {item.name}
                    </AppText>
                    <AppText variant="caption">
                      {country?.name ?? item.iso}
                      {item.pop ? `  ·  ${Intl.NumberFormat().format(item.pop)} people` : ""}
                    </AppText>
                  </View>
                </Pressable>
              );
            }}
            ListFooterComponent={
              trimmed && countryIso ? (
                <Pressable onPress={pickCustom} className="flex-row items-center gap-3 py-3">
                  <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                  <AppText variant="heading" className="text-base text-primary dark:text-primary-dark">
                    Add “{trimmed}” as a custom city
                  </AppText>
                </Pressable>
              ) : null
            }
            ListEmptyComponent={
              !trimmed ? (
                <AppText variant="caption" className="py-6 text-center">
                  Type to search {countryIso ? "cities in this country" : "any city worldwide"}.
                </AppText>
              ) : null
            }
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
