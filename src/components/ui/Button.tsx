import { ActivityIndicator, Platform, Pressable, type PressableProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { AppText } from "./AppText";
import { cn } from "@/lib/cn";
import { useTheme } from "@/hooks/useTheme";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const containerClasses: Record<Variant, string> = {
  primary: "bg-primary dark:bg-primary-dark",
  secondary: "bg-paper-sunken dark:bg-paper-dark-raised border border-line dark:border-line-dark",
  ghost: "bg-transparent",
  danger: "bg-danger dark:bg-danger-dark",
};

const textClasses: Record<Variant, string> = {
  primary: "text-white dark:text-paper-dark font-sans-semibold",
  secondary: "text-ink dark:text-ink-dark font-sans-semibold",
  ghost: "text-primary dark:text-primary-dark font-sans-semibold",
  danger: "text-white dark:text-paper-dark font-sans-semibold",
};

interface ButtonProps extends Omit<PressableProps, "children"> {
  title: string;
  variant?: Variant;
  loading?: boolean;
  className?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({ title, variant = "primary", loading, disabled, className, ...props }: ButtonProps) {
  const scale = useSharedValue(1);
  const { isDark, colors } = useTheme();
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const spinnerColor =
    variant === "primary" || variant === "danger"
      ? isDark
        ? colors.paper
        : "#FFFFFF"
      : colors.primary;

  const web = Platform.OS === "web";
  const Control = web ? Pressable : AnimatedPressable;

  return (
    <Control
      accessibilityRole="button"
      disabled={disabled || loading}
      onPressIn={web ? undefined : () => scale.set(withSpring(0.97, { damping: 20, stiffness: 400 }))}
      onPressOut={web ? undefined : () => scale.set(withSpring(1, { damping: 20, stiffness: 400 }))}
      style={web ? undefined : animatedStyle}
      className={cn(
        "h-13 flex-row items-center justify-center rounded-2xl px-6 py-3.5",
        containerClasses[variant],
        (disabled || loading) && "opacity-50",
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={web && variant === "primary" ? "#1B1410" : spinnerColor} />
      ) : (
        <AppText className={cn("text-base", textClasses[variant])} style={web && variant === "primary" ? { color: "#1B1410" } : undefined}>{title}</AppText>
      )}
    </Control>
  );
}
