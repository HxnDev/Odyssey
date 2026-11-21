import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";

interface AuthScreenShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthScreenShell({ title, subtitle, children }: AuthScreenShellProps) {
  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(500).springify()} className="web:mx-auto web:w-full web:max-w-md">
            <View className="mb-10 items-start gap-2">
              <AppText className="text-4xl">🧭</AppText>
              <AppText variant="display">{title}</AppText>
              <AppText variant="label">{subtitle}</AppText>
            </View>
            {children}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
