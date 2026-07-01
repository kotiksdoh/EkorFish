import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: screenHeight } = Dimensions.get("screen");

const SPRING_OPEN = {
  useNativeDriver: true,
  damping: 22,
  stiffness: 180,
  mass: 0.85,
  overshootClamping: true,
} as const;

type Props = {
  visible: boolean;
  onClose: () => void;
  showBackdrop?: boolean;
  children: React.ReactNode;
  onBindCloseRequest?: (close: (() => void) | null) => void;
  contentHorizontalPadding?: number;
};

/**
 * Второй bottom sheet поверх уже открытого (без вложенного Modal).
 * Sheet прижат к bottom: 0 — без щели и без «отлёта» вверх на iOS.
 */
export function AnimatedStackedSheet({
  visible,
  onClose,
  showBackdrop = true,
  children,
  onBindCloseRequest,
  contentHorizontalPadding = 16,
}: Props) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const closingRef = useRef(false);
  const [mounted, setMounted] = useState(visible);

  const closeWithAnimation = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      closingRef.current = false;
      translateY.setValue(screenHeight);
      setMounted(false);
      onClose();
    });
  }, [onClose, translateY]);

  const openWithAnimation = useCallback(() => {
    closingRef.current = false;
    translateY.setValue(screenHeight);
    Animated.spring(translateY, {
      toValue: 0,
      ...SPRING_OPEN,
    }).start();
  }, [translateY]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!mounted) return;
    if (visible) {
      openWithAnimation();
      return;
    }
    if (!closingRef.current) {
      closeWithAnimation();
    }
  }, [visible, mounted, openWithAnimation, closeWithAnimation]);

  useEffect(() => {
    onBindCloseRequest?.(visible && mounted ? closeWithAnimation : null);
    return () => onBindCloseRequest?.(null);
  }, [closeWithAnimation, onBindCloseRequest, visible, mounted]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 90 || g.vy > 0.45) {
          closeWithAnimation();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            ...SPRING_OPEN,
          }).start();
        }
      },
    }),
  ).current;

  if (!mounted && !visible) return null;

  const sheetBottomPadding = 16 + insets.bottom;

  return (
    <View
      style={[styles.root, showBackdrop && styles.rootDimmed]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={closeWithAnimation}
      />
      <Animated.View
        style={[
          styles.sheet,
          isDark && styles.sheetDark,
          {
            paddingHorizontal: contentHorizontalPadding,
            paddingBottom: sheetBottomPadding,
            transform: [{ translateY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.swipeHandleContainer}
          activeOpacity={0.7}
          onPress={closeWithAnimation}
        >
          <View style={[styles.handle, isDark && styles.handleDark]} />
        </TouchableOpacity>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 55,
    justifyContent: "flex-end",
  },
  rootDimmed: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    maxHeight: "92%",
    overflow: "hidden",
  },
  sheetDark: {
    backgroundColor: "#202022",
  },
  swipeHandleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
    width: "100%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
  },
  handleDark: {
    backgroundColor: "#404040",
  },
});
