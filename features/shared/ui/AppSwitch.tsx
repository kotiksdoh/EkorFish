import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const switchScale = Math.min(Math.max(screenWidth / 390, 0.85), 1);
const SWITCH_TRACK_WIDTH = 64 * switchScale;
const SWITCH_TRACK_HEIGHT = 28 * switchScale;
const SWITCH_THUMB_WIDTH = 36 * switchScale;
const SWITCH_THUMB_HEIGHT = 24 * switchScale;
const SWITCH_THUMB_OFFSET = 2 * switchScale;
const SWITCH_THUMB_TRANSLATE =
  SWITCH_TRACK_WIDTH - SWITCH_THUMB_WIDTH - SWITCH_THUMB_OFFSET * 2;

interface AppSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  isDark: boolean;
  disabled?: boolean;
}

export const AppSwitch: React.FC<AppSwitchProps> = ({
  value,
  onValueChange,
  isDark,
  disabled = false,
}) => {
  const thumbTranslate = useRef(
    new Animated.Value(value ? SWITCH_THUMB_TRANSLATE : 0),
  ).current;

  useEffect(() => {
    Animated.timing(thumbTranslate, {
      toValue: value ? SWITCH_THUMB_TRANSLATE : 0,
      duration: 170,
      useNativeDriver: true,
    }).start();
  }, [thumbTranslate, value]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      style={[
        styles.appSwitchTrack,
        {
          backgroundColor: value
            ? isDark
              ? "#4C94FF"
              : "#203686"
            : isDark
              ? "#ECEFFA26"
              : "#03051E1F",
        },
      ]}
    >
      <Animated.View
        style={[
          styles.appSwitchThumb,
          {
            transform: [{ translateX: thumbTranslate }],
          },
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  appSwitchTrack: {
    width: SWITCH_TRACK_WIDTH,
    height: SWITCH_TRACK_HEIGHT,
    borderRadius: SWITCH_TRACK_HEIGHT / 2,
    overflow: "hidden",
    position: "relative",
  },
  appSwitchThumb: {
    position: "absolute",
    top: SWITCH_THUMB_OFFSET,
    left: SWITCH_THUMB_OFFSET,
    width: SWITCH_THUMB_WIDTH,
    height: SWITCH_THUMB_HEIGHT,
    borderRadius: 100,
    backgroundColor: "#FBFCFF",
  },
});
