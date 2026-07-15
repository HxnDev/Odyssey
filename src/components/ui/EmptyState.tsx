import { View } from "react-native";
import { AppText } from "./AppText";
import { Button } from "./Button";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  message?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji = "🧭", title, message, actionTitle, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-10 py-16">
      <AppText className="text-5xl">{emoji}</AppText>
      <AppText variant="title" className="text-center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="label" className="text-center">
          {message}
        </AppText>
      ) : null}
      {actionTitle && onAction ? (
        <Button title={actionTitle} variant="secondary" onPress={onAction} className="mt-2" />
      ) : null}
    </View>
  );
}
