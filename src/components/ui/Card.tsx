import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/cn";

interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ className, ...props }: CardProps) {
  return (
    <View
      className={cn(
        "rounded-card border border-line bg-paper-raised p-4",
        "dark:border-line-dark dark:bg-paper-dark-raised",
        className,
      )}
      {...props}
    />
  );
}
