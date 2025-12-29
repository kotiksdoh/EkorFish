import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableWithoutFeedback
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
  ...props
}) => {
    const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useState(new Animated.Value(value ? 1 : 0))[0];
  const inputRef = useRef<TextInput>(null);

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
    <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
      <ThemedView lightColor='#03051E08' darkColor='#ECEFFA0D' style={[styles.container, style]}>
        <Animated.Text style={[styles.placeholder, animatedStyle]}>
          {placeholder}
        </Animated.Text>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            Platform.OS === 'android' && styles.inputAndroid, // Специальные стили для Android
            inputStyle,
            { 
              color: color
            }
          ]}
          placeholder=""
          placeholderTextColor="transparent" // Делаем плейсхолдер прозрачным
          keyboardType={keyboardType as any}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength}
          textAlignVertical="center"
          {...props}
        />
      </ThemedView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    width: '100%',
    backgroundColor: '#03051E08',
    borderRadius: 12,
    borderWidth: 0.1,
    borderColor: 'transparent',
    justifyContent: 'center',
    position: 'relative',
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
    paddingTop: 20, // Для iOS
    paddingBottom: 10,
  },
  inputAndroid: {
    paddingTop: Platform.OS === 'android' ? 25 : 20, // Больше paddingTop для Android
    paddingBottom: Platform.OS === 'android' ? 5 : 10,
    includeFontPadding: false, // Важно для Android - убираем стандартные отступы шрифта
    textAlignVertical: 'center', // Центрируем текст по вертикали
  },
  placeholder: {
    position: 'absolute',
    zIndex: 1,
    backgroundColor: 'transparent',
    includeFontPadding: false,
    pointerEvents: 'none', // Чтобы не перехватывал тапы
  },
});

export default AnimatedTextInput;