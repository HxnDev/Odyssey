import "./MapWebStyles.css";

import { Ionicons } from "@expo/vector-icons";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import type { CountrySheetFrameProps, CountrySheetHandle } from "./CountrySheetFrame";

export const CountrySheetFrame = forwardRef<CountrySheetHandle, CountrySheetFrameProps>(
  function CountrySheetFrame({ children, onDismiss }, ref) {
    const dialog = useRef<HTMLDialogElement>(null);
    const { colors } = useTheme();

    useImperativeHandle(ref, () => ({
      present: () => {
        if (dialog.current && !dialog.current.open) dialog.current.showModal();
      },
    }), []);

    useEffect(() => {
      if (!children && dialog.current?.open) dialog.current.close();
    }, [children]);

    return (
      <dialog
        ref={dialog}
        aria-label="Country overview"
        onClose={onDismiss}
        className="odyssey-country-dialog"
        style={{ backgroundColor: colors.paperRaised, color: colors.ink, borderColor: colors.line }}
      >
        <View className="mb-2 flex-row justify-end">
          <Pressable accessibilityRole="button" accessibilityLabel="Close country overview" onPress={() => dialog.current?.close()}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </Pressable>
        </View>
        {children}
      </dialog>
    );
  },
);
