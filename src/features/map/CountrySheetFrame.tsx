import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { forwardRef, useImperativeHandle, useRef, type ReactNode } from "react";
import { useTheme } from "@/hooks/useTheme";

export interface CountrySheetHandle {
  present: () => void;
}

export interface CountrySheetFrameProps {
  children: ReactNode;
  onDismiss: () => void;
}

export const CountrySheetFrame = forwardRef<CountrySheetHandle, CountrySheetFrameProps>(
  function CountrySheetFrame({ children, onDismiss }, ref) {
    const modal = useRef<BottomSheetModal>(null);
    const { colors } = useTheme();
    useImperativeHandle(ref, () => ({ present: () => modal.current?.present() }), []);
    return (
      <BottomSheetModal
        ref={modal}
        onDismiss={onDismiss}
        snapPoints={["62%", "88%"]}
        enableDynamicSizing={false}
        backgroundStyle={{ backgroundColor: colors.paperRaised, borderRadius: 28 }}
        handleIndicatorStyle={{ backgroundColor: colors.line }}
      >
        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}>
          {children}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);
