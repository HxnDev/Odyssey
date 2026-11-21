import type { AlertButton } from "react-native";

export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    const text = message ? `${title}\n\n${message}` : title;
    const action = buttons?.find((button) => button.style !== "cancel");
    if (action) {
      if (window.confirm(`${text}\n\n${action.text ?? "Continue"}?`)) action.onPress?.();
      return;
    }
    window.alert(text);
  },
};
