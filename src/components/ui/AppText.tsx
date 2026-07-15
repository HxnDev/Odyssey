import { Text, type TextProps } from "react-native";
import { cn } from "@/lib/cn";

type Variant =
  | "display"
  | "title"
  | "heading"
  | "body"
  | "label"
  | "caption";

const variantClasses: Record<Variant, string> = {
  display: "font-display-black text-4xl text-ink dark:text-ink-dark",
  title: "font-display text-2xl text-ink dark:text-ink-dark",
  heading: "font-sans-semibold text-lg text-ink dark:text-ink-dark",
  body: "font-sans text-base text-ink dark:text-ink-dark",
  label: "font-sans-medium text-sm text-ink-soft dark:text-ink-dark-soft",
  caption: "font-sans text-xs text-ink-faint dark:text-ink-dark-faint",
};

interface AppTextProps extends TextProps {
  variant?: Variant;
  className?: string;
}

export function AppText({ variant = "body", className, ...props }: AppTextProps) {
  return <Text className={cn(variantClasses[variant], className)} {...props} />;
}
