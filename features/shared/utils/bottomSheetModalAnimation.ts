import { Animated } from "react-native";

export const SHEET_CLOSE_MS = 220;
export const OVERLAY_FADE_OUT_MS = 120;
export const OVERLAY_FADE_IN_MS = 160;
export const SHEET_OPEN_MS = 220;

export function prepareBottomSheetHidden(
  translateY: Animated.Value,
  overlayOpacity: Animated.Value,
  screenHeight: number,
) {
  translateY.setValue(screenHeight);
  overlayOpacity.setValue(0);
}

export function animateBottomSheetOpen(
  translateY: Animated.Value,
  overlayOpacity: Animated.Value,
  screenHeight: number,
) {
  prepareBottomSheetHidden(translateY, overlayOpacity, screenHeight);

  Animated.parallel([
    Animated.timing(translateY, {
      toValue: 0,
      duration: SHEET_OPEN_MS,
      useNativeDriver: true,
    }),
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: OVERLAY_FADE_IN_MS,
      useNativeDriver: true,
    }),
  ]).start();
}

export function animateBottomSheetClose(
  translateY: Animated.Value,
  overlayOpacity: Animated.Value,
  screenHeight: number,
  onDone: () => void,
) {
  Animated.parallel([
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: SHEET_CLOSE_MS,
      useNativeDriver: true,
    }),
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: OVERLAY_FADE_OUT_MS,
      useNativeDriver: true,
    }),
  ]).start(() => {
    translateY.setValue(screenHeight);
    overlayOpacity.setValue(0);
    onDone();
  });
}
