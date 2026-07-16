import { Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { AppText } from "./AppText";
import { cn } from "@/lib/cn";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Explicit colors for selected state (e.g. per-status colors). */
  selectedColor?: string;
  className?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Chip({ label, selected, onPress, selectedColor, className }: ChipProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      onPressIn={() => scale.set(withSpring(0.94, { damping: 18, stiffness: 400 }))}
      onPressOut={() => scale.set(withSpring(1, { damping: 18, stiffness: 400 }))}
      style={[animatedStyle, selected && selectedColor ? { backgroundColor: selectedColor, borderColor: selectedColor } : undefined]}
      className={cn(
        "rounded-chip border px-4 py-2",
        selected
          ? "border-primary bg-primary dark:border-primary-dark dark:bg-primary-dark"
          : "border-line bg-paper-raised dark:border-line-dark dark:bg-paper-dark-raised",
        className,
      )}
    >
      <AppText
        className={cn(
          "font-sans-semibold text-sm",
          selected ? "text-white dark:text-paper-dark" : "text-ink-soft dark:text-ink-dark-soft",
        )}
      >
        {label}
      </AppText>
    </AnimatedPressable>
  );
}
