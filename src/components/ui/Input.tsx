import { forwardRef, useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { AppText } from "./AppText";
import { cn } from "@/lib/cn";
import { useTheme } from "@/hooks/useTheme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, className, ...props },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const { colors } = useTheme();

  return (
    <View className={cn("gap-1.5", className)}>
      {label ? <AppText variant="label">{label}</AppText> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.inkFaint}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        className={cn(
          "rounded-2xl border bg-paper-raised px-4 py-3.5 font-sans text-base text-ink",
          "dark:bg-paper-dark-raised dark:text-ink-dark",
          focused
            ? "border-teal dark:border-teal-dark"
            : "border-line dark:border-line-dark",
          error && "border-danger dark:border-danger-dark",
        )}
        {...props}
      />
      {error ? (
        <AppText variant="caption" className="text-danger dark:text-danger-dark">
          {error}
        </AppText>
      ) : null}
    </View>
  );
});
