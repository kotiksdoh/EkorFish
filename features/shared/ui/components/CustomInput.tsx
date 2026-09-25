import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  FIXED_TEXT_PROPS,
  getFixedTextInputStyle,
  getFixedTextStyle,
} from '@/utils/fixedTextStyle';
import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Animated,
  InputAccessoryView,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface AnimatedTextInputProps extends Omit<TextInputProps, 'style'> {
  placeholder?: string;
  placeholderTextColor?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  maxLength?: number;
  style?: any;
  inputStyle?: any;
  lightColor?: string;
  darkColor?: string;
  disabled?: boolean;
}

const AnimatedTextInput: React.FC<AnimatedTextInputProps> = ({
  placeholder = "Номер телефона или E-mail",
  placeholderTextColor = "#80818B",
  keyboardType = "default",
  value = '',
  onChangeText,
  maxLength = 50,
  style,
  inputStyle,
  lightColor,
  darkColor,
  disabled = false,
  multiline,
  returnKeyType,
  onSubmitEditing,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  ...textInputProps
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useState(new Animated.Value(value ? 1 : 0))[0];
  const inputRef = useRef<TextInput>(null);
  const reactId = useId();
  const iosDoneAccessoryId = `ekorfish.keyboard.done.${reactId.replace(/:/g, "")}`;
  const showIosDoneAccessory = Platform.OS === 'ios';

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  const handleFocus: TextInputProps["onFocus"] = (event) => {
    setIsFocused(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onFocusProp?.(event);
  };

  const handleBlur: TextInputProps["onBlur"] = (event) => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
    onBlurProp?.(event);
  };

  const handleContainerPress = () => {
    if (disabled) return;
    if (multiline && isFocused) {
      inputRef.current?.blur();
      return;
    }
    inputRef.current?.focus();
  };

  const handleChangeText = (text: string) => {
    if (disabled) return;
    if (onChangeText) {
      onChangeText(text);
    }
    if (!isFocused && text) {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const animatedStyle = {
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
      outputRange: [placeholderTextColor, placeholderTextColor],
    }),
    left: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [12, 12],
    }),
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={handleContainerPress}>
        <ThemedView
          style={[
            styles.container,
            multiline && styles.containerMultiline,
            style,
            { backgroundColor: isDarkMode ? '#ECEFFA0D' : '#03051E08' },
            disabled && styles.containerDisabled,
          ]}
        >
          <Animated.Text
            {...FIXED_TEXT_PROPS}
            style={getFixedTextStyle([styles.placeholder, animatedStyle])}
          >
            {placeholder}
          </Animated.Text>
          <TextInput
            ref={inputRef}
            {...FIXED_TEXT_PROPS}
            style={getFixedTextInputStyle([
              styles.input,
              multiline && styles.inputMultiline,
              Platform.OS === 'android' && !multiline && styles.inputAndroid,
              Platform.OS === 'android' && multiline && styles.inputAndroidMultiline,
              inputStyle,
              { color },
            ])}
            placeholder=""
            placeholderTextColor="transparent"
            underlineColorAndroid="transparent"
            keyboardType={keyboardType as any}
            value={value}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            maxLength={maxLength}
            editable={!disabled}
            textAlignVertical={multiline ? "top" : "center"}
            multiline={multiline}
            blurOnSubmit={!multiline}
            returnKeyType={multiline ? "done" : returnKeyType}
            onSubmitEditing={
              multiline ? () => inputRef.current?.blur() : onSubmitEditing
            }
            {...textInputProps}
            inputAccessoryViewID={
              showIosDoneAccessory
                ? iosDoneAccessoryId
                : textInputProps.inputAccessoryViewID
            }
          />
        </ThemedView>
      </TouchableWithoutFeedback>
      {showIosDoneAccessory ? (
        <InputAccessoryView nativeID={iosDoneAccessoryId}>
          <View
            style={[
              styles.accessoryBar,
              { backgroundColor: isDarkMode ? '#2C2C2E' : '#D1D3D9' },
            ]}
          >
            <TouchableOpacity
              onPress={Keyboard.dismiss}
              hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Готово"
            >
              <Text
                style={[
                  styles.accessoryDone,
                  { color: isDarkMode ? '#4C94FF' : '#203686' },
                ]}
              >
                Готово
              </Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    width: '100%',
    borderRadius: 12,
    borderWidth: 0.1,
    borderColor: 'transparent',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  containerDisabled: {
    opacity: 0.5,
  },
  containerMultiline: {
    height: undefined,
    minHeight: 80,
    justifyContent: 'flex-start',
  },
  input: {
    borderRadius: 12,
    height: '100%',
    width: '100%',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1B1B1C',
    backgroundColor: 'transparent',
    fontWeight: '500',
    paddingTop: 20,
    paddingBottom: 10,
  },
  inputMultiline: {
    height: undefined,
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 28,
    paddingBottom: 12,
  },
  inputAndroid: {
    paddingTop: Platform.OS === 'android' ? 20 : 20,
    paddingBottom: Platform.OS === 'android' ? 8 : 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  inputAndroidMultiline: {
    paddingTop: 28,
    paddingBottom: 12,
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  placeholder: {
    position: 'absolute',
    zIndex: 1,
    backgroundColor: 'transparent',
    includeFontPadding: false,
    pointerEvents: 'none',
    fontWeight: '500'
  },
  accessoryBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.15)',
  },
  accessoryDone: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AnimatedTextInput;
