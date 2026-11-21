import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { FlatList, Platform, Pressable, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { fonts } from "@/lib/theme";
import { searchCountries, type Country } from "@/features/countries/data";

interface MapSearchBarProps {
  onSelect: (country: Country) => void;
}

export function MapSearchBar({ onSelect }: MapSearchBarProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const { colors } = useTheme();

  const results = useMemo(
    () => (query.trim() ? searchCountries(query).slice(0, 8) : []),
    [query],
  );

  const selectCountry = (country: Country) => {
    onSelect(country);
    setQuery("");
  };

  return (
    <View className="gap-2" id="odyssey-map-search">
      <View className="flex-row items-center gap-2 rounded-2xl border border-line bg-paper-raised px-4 shadow-sm dark:border-line-dark dark:bg-paper-dark-raised">
        <Ionicons name="search" size={18} color={colors.inkFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === "Escape") setQuery("");
          }}
          onSubmitEditing={() => {
            if (results[0]) selectCountry(results[0]);
          }}
          placeholder="Search countries"
          placeholderTextColor={colors.inkFaint}
          style={{ fontFamily: fonts.sans, color: colors.ink }}
          className="h-12 flex-1 text-base"
        />
        {query ? (
          <Pressable onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.inkFaint} />
          </Pressable>
        ) : null}
      </View>

      {(focused || Platform.OS === "web") && results.length > 0 ? (
        <Animated.View
          id="odyssey-map-results"
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          className="max-h-72 overflow-hidden rounded-2xl border border-line bg-paper-raised shadow-lg dark:border-line-dark dark:bg-paper-dark-raised"
        >
          <FlatList
            data={results}
            keyExtractor={(item) => item.iso}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => selectCountry(item)}
                className="flex-row items-center gap-3 border-b border-line px-4 py-3 dark:border-line-dark"
              >
                <AppText className="text-xl">{item.flag}</AppText>
                <View className="flex-1">
                  <AppText variant="heading" className="text-base">
                    {item.name}
                  </AppText>
                  <AppText variant="caption">{item.continent}</AppText>
                </View>
              </Pressable>
            )}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}
