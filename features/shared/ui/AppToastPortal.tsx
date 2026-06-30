import { AppToastOverlay } from "@/features/shared/ui/AppToastOverlay";
import {
  getCurrentToast,
  subscribeAppToast,
} from "@/features/shared/services/appToast";
import { StyleSheet, View } from "react-native";
import { useSyncExternalStore } from "react";

export function AppToastPortal() {
  const toast = useSyncExternalStore(
    subscribeAppToast,
    getCurrentToast,
    getCurrentToast,
  );

  if (!toast) {
    return null;
  }

  return (
    <View style={styles.host} pointerEvents="box-none">
      <AppToastOverlay toast={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999999,
    elevation: 999999,
  },
});
