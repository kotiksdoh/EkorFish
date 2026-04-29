import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import React, { useCallback, useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
const SCREEN_HEIGHT = Dimensions.get("window").height;
const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.92;

type SnapBottomSheetProps = {
  visible: boolean;
  title?: string;
  /** Выравнивание заголовка (по умолчанию по центру) */
  titleAlign?: "left" | "center";
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * Модалка с «защёлкой» снизу (свайп вниз закрывает). Переиспользуемый компонент.
 */
export function SnapBottomSheet({
  visible,
  title,
  titleAlign = "center",
  onClose,
  children,
}: SnapBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const backgroundColor = useThemeColor({}, "background");
  const translateY = useRef(new Animated.Value(MAX_SHEET_HEIGHT)).current;

  const closeAnimated = useCallback(() => {
    Animated.timing(translateY, {
      toValue: MAX_SHEET_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [onClose, translateY]);

  useEffect(() => {
    if (visible) {
      translateY.setValue(MAX_SHEET_HEIGHT);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 180,
      }).start();
    }
  }, [visible, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 90 || g.vy > 0.45) {
          closeAnimated();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 22,
            stiffness: 180,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={closeAnimated}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={closeAnimated}
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor,
              maxHeight: MAX_SHEET_HEIGHT,
              paddingBottom: 24 + insets.bottom,
              transform: [{ translateY }],
            },
            isDarkMode && { borderColor: "#252527" },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          {title ? (
            <ThemedText
              style={[
                styles.title,
                titleAlign === "left" && styles.titleLeft,
              ]}
            >
              {title}
            </ThemedText>
          ) : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#F0F3F7",
    paddingBottom: 24,
    paddingHorizontal: 16,
    minHeight: 200,
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#C0C0C5",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  titleLeft: {
    textAlign: "left",
    alignSelf: "stretch",
  },
});
