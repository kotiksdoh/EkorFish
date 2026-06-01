import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, Platform, ScrollView } from "react-native";

type UseKeyboardAwareScrollOptions = {
  enabled?: boolean;
};

export function useKeyboardAwareScroll({
  enabled = true,
}: UseKeyboardAwareScrollOptions = {}) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const scrollOffsetBeforeKeyboard = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const handleScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      scrollYRef.current = event.nativeEvent.contentOffset.y;
    },
    [],
  );

  const onInputFocus = useCallback(() => {
    scrollOffsetBeforeKeyboard.current = scrollYRef.current;
  }, []);

  useEffect(() => {
    if (!enabled) {
      setKeyboardHeight(0);
      return;
    }

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      scrollOffsetBeforeKeyboard.current = scrollYRef.current;
      setKeyboardHeight(event.endCoordinates.height);
      const delay = Platform.OS === "ios" ? (event.duration ?? 250) : 100;
      setTimeout(scrollToEnd, delay);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          y: scrollOffsetBeforeKeyboard.current,
          animated: true,
        });
      });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [enabled, scrollToEnd]);

  const androidKeyboardMargin =
    keyboardHeight > 0 && Platform.OS === "android" ? keyboardHeight : 0;

  return {
    scrollRef,
    keyboardHeight,
    handleScroll,
    onInputFocus,
    androidKeyboardMargin,
  };
}
