import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

interface PromoCodeInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onApply: () => void;
  loading?: boolean;
  hasError?: boolean;
  disabled?: boolean;
}

export const PromoCodeInput: React.FC<PromoCodeInputProps> = ({
  value,
  onChangeText,
  onApply,
  loading = false,
  hasError = false,
  disabled = false,
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useState(new Animated.Value(value ? 1 : 0))[0];
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value || isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, isFocused, animatedValue]);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
    if (!isFocused && text) {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const placeholderColor = "#80818B";
  const textColor = hasError ? "#FF453A" : isDarkMode ? "#FBFCFF" : "#1B1B1C";
  const canApply = value.trim().length > 0 && !loading && !disabled;

  const animatedLabelStyle = {
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [15, 5],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [placeholderColor, placeholderColor],
    }),
    left: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [12, 12],
    }),
  };

  return (
    <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDarkMode ? "#ECEFFA0D" : "#03051E08",
          },
        ]}
      >
        <Animated.Text style={[styles.placeholder, animatedLabelStyle]}>
          Промокод
        </Animated.Text>

        <View style={styles.contentRow}>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              Platform.OS === "android" && styles.inputAndroid,
              { color: textColor },
            ]}
            value={value}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!disabled && !loading}
            placeholder=""
            placeholderTextColor="transparent"
            returnKeyType="done"
            onSubmitEditing={() => {
              if (canApply) {
                onApply();
              }
            }}
          />

          <TouchableOpacity
            style={[
              styles.applyButton,
              {
                backgroundColor: isDarkMode ? "#323235" : "#EBEDF0",
              },
              !canApply && styles.applyButtonDisabled,
            ]}
            onPress={onApply}
            disabled={!canApply}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
              />
            ) : (
              <Text
                style={[
                  styles.applyButtonText,
                  { color: isDarkMode ? "#FBFCFF" : "#1B1B1C" },
                  !canApply && styles.applyButtonTextDisabled,
                ]}
              >
                Применить
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 50,
    width: "100%",
    borderRadius: 12,
    justifyContent: "center",
    position: "relative",
  },
  placeholder: {
    position: "absolute",
    zIndex: 1,
    backgroundColor: "transparent",
    includeFontPadding: false,
    pointerEvents: "none",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 6,
    paddingLeft: 4,
    minHeight: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    paddingHorizontal: 8,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "transparent",
  },
  inputAndroid: {
    paddingTop: 25,
    paddingBottom: 5,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  applyButton: {
    minWidth: 104,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  applyButtonDisabled: {
    opacity: 0.55,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  applyButtonTextDisabled: {
    opacity: 0.7,
  },
});
