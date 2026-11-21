import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/lib/cn";

interface ScreenProps extends ViewProps {
  className?: string;
  /** Skip top inset (e.g. when a header handles it). */
  noTopInset?: boolean;
}

export function Screen({ className, style, noTopInset, ...props }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[{ paddingTop: noTopInset ? 0 : insets.top }, style]}
      className={cn("flex-1 bg-paper dark:bg-paper-dark web:mx-auto web:w-full web:max-w-4xl", className)}
      {...props}
    />
  );
}
