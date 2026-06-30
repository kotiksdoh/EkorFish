import { buildAppToastConfig } from "@/features/shared/ui/appToastConfig";
import {
  dismissAppToast,
  type AppToastState,
} from "@/features/shared/services/appToast";
import { useTheme } from "@/contexts/ThemeContext";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  toast: AppToastState;
};

export function AppToastOverlay({ toast }: Props) {
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const isDark = currentTheme === "dark";
  const toastConfig = useMemo(() => buildAppToastConfig(isDark), [isDark]);

  const ToastRenderer = toastConfig[toast.type] ?? toastConfig.default;

  return (
    <View
      style={[styles.slot, { top: 10 + insets.top }]}
      pointerEvents="box-none"
    >
      <View style={styles.toastWrap} pointerEvents="auto">
        <ToastRenderer
          text1={toast.text1}
          text2={toast.text2}
          hide={dismissAppToast}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: "4%",
    zIndex: 999999,
    elevation: 999999,
  },
  toastWrap: {
    width: "100%",
    maxWidth: "100%",
  },
});
