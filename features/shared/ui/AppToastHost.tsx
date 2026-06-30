import { AppToastOverlay } from "@/features/shared/ui/AppToastOverlay";
import {
  getAppModalLayerCount,
  getCurrentToast,
  subscribeAppModalLayers,
  subscribeAppToast,
} from "@/features/shared/services/appToast";
import { Platform, StyleSheet, View } from "react-native";
import { useSyncExternalStore } from "react";
import { FullWindowOverlay } from "react-native-screens";

export function AppToastHost() {
  const toast = useSyncExternalStore(
    subscribeAppToast,
    getCurrentToast,
    getCurrentToast,
  );
  const modalLayerCount = useSyncExternalStore(
    subscribeAppModalLayers,
    getAppModalLayerCount,
    () => 0,
  );

  if (!toast || modalLayerCount > 0) {
    return null;
  }

  const overlay = (
    <View style={styles.host} pointerEvents="box-none">
      <AppToastOverlay toast={toast} />
    </View>
  );

  if (Platform.OS === "ios") {
    return (
      <FullWindowOverlay unstable_accessibilityContainerViewIsModal={false}>
        {overlay}
      </FullWindowOverlay>
    );
  }

  return overlay;
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999999,
    elevation: 999999,
  },
});
