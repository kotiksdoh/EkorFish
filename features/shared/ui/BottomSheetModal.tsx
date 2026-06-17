import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";

import {
  animateBottomSheetClose,
  animateBottomSheetOpen,
  prepareBottomSheetHidden,
} from "@/features/shared/utils/bottomSheetModalAnimation";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export type BottomSheetModalRef = {
  close: (afterClose?: () => void) => void;
};

type BottomSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isDarkMode?: boolean;
  maxHeight?: ViewStyle["maxHeight"];
  sheetStyle?: ViewStyle;
  /** Sheet height follows content instead of stretching to maxHeight */
  fitContent?: boolean;
};

export const BottomSheetModal = forwardRef<
  BottomSheetModalRef,
  BottomSheetModalProps
>(function BottomSheetModal(
  {
    visible,
    onClose,
    children,
    isDarkMode = false,
    maxHeight = "70%",
    sheetStyle,
    fitContent = false,
  },
  ref,
) {
  const [isClosing, setIsClosing] = useState(false);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const afterCloseRef = useRef<(() => void) | undefined>(undefined);

  const isPresented = visible || isClosing;

  const runClose = useCallback(
    (afterClose?: () => void) => {
      if (isClosing) return;

      afterCloseRef.current = afterClose;
      setIsClosing(true);
      animateBottomSheetClose(
        translateY,
        overlayOpacity,
        SCREEN_HEIGHT,
        () => {
          setIsClosing(false);
          prepareBottomSheetHidden(translateY, overlayOpacity, SCREEN_HEIGHT);
          onClose();
          afterCloseRef.current?.();
          afterCloseRef.current = undefined;
        },
      );
    },
    [isClosing, onClose, overlayOpacity, translateY],
  );

  useImperativeHandle(ref, () => ({ close: runClose }), [runClose]);

  useEffect(() => {
    if (!visible || isClosing) {
      return;
    }

    prepareBottomSheetHidden(translateY, overlayOpacity, SCREEN_HEIGHT);
    const frame = requestAnimationFrame(() => {
      animateBottomSheetOpen(translateY, overlayOpacity, SCREEN_HEIGHT);
    });

    return () => cancelAnimationFrame(frame);
  }, [visible, isClosing, overlayOpacity, translateY]);

  return (
    <Modal
      visible={isPresented}
      animationType="none"
      transparent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={() => runClose()}
    >
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => runClose()}
        />
        <Animated.View
          style={[
            styles.sheet,
            isDarkMode && styles.sheetDark,
            fitContent ? styles.sheetFitContent : { maxHeight },
            { transform: [{ translateY }] },
            sheetStyle,
          ]}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sheetDark: {
    backgroundColor: "#202022",
  },
  sheetFitContent: {
    alignSelf: "stretch",
  },
});
