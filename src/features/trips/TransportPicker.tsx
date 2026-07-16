import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { useTheme } from "@/hooks/useTheme";
import { TRANSPORT_MODES } from "@/lib/transport";

interface TransportPickerProps {
  value: string | null;
  onChange: (id: string | null) => void;
  /** Tapping the selected mode deselects it (used for per-stop transport). */
  allowDeselect?: boolean;
  showLabels?: boolean;
}

/** Been-style transport selector: a row of circular icon buttons. */
export function TransportPicker({ value, onChange, allowDeselect, showLabels }: TransportPickerProps) {
  const { colors } = useTheme();
  return (
    <View className="flex-row flex-wrap gap-3">
      {TRANSPORT_MODES.map((mode) => {
        const selected = value === mode.id;
        return (
          <Pressable
            key={mode.id}
            accessibilityLabel={mode.label}
            onPress={() => onChange(selected && allowDeselect ? null : mode.id)}
            className="items-center gap-1"
          >
            <View
              className={`h-12 w-12 items-center justify-center rounded-full ${
                selected
                  ? "bg-primary dark:bg-primary-dark"
                  : "border border-line bg-paper-sunken dark:border-line-dark dark:bg-paper-dark-sunken"
              }`}
            >
              <MaterialCommunityIcons
                name={mode.icon}
                size={22}
                color={selected ? "#FFFFFF" : colors.inkSoft}
              />
            </View>
            {showLabels ? (
              <AppText
                variant="caption"
                className={selected ? "font-sans-semibold text-primary dark:text-primary-dark" : ""}
              >
                {mode.label}
              </AppText>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
