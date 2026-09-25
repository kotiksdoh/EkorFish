import { ThemedView } from '@/components/themed-view';
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

interface SmartInputProps extends Omit<TextInputProps, 'style' | 'value' | 'onChangeText'> {
  placeholder?: string;
  placeholderTextColor?: string;
  value?: string;
  onChangeText?: (text: string, formattedText?: string, isPhone?: boolean) => void;
  maxLength?: number;
  style?: any;
  inputStyle?: any;
  lightColor?: string;
  darkColor?: string;
}

const SmartInput: React.FC<SmartInputProps> = ({
  placeholder = "Номер телефона или E-mail",
  placeholderTextColor = "#80818B",
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
  const [inputValue, setInputValue] = useState('');
  const [isPhoneMode, setIsPhoneMode] = useState(false);
  const animatedValue = useState(new Animated.Value(value ? 1 : 0))[0];
  const inputRef = useRef<TextInput>(null);
  const reactId = useId();
  const iosDoneAccessoryId = `ekorfish.smart.keyboard.done.${reactId.replace(/:/g, "")}`;
  const showIosDoneAccessory = Platform.OS === 'ios';

  // Простая проверка на email символы
  const isEmailLike = (text: string): boolean => {
    return /[a-zA-Z@.]/.test(text);
  };

  // Форматирование телефона
  const formatPhone = (text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    
    // Если номер пустой
    if (!cleaned) return '';
    
    // Приводим к формату +7
    let phone = cleaned;
    if (phone.startsWith('7') || phone.startsWith('8')) {
      phone = '7' + phone.substring(1);
    } else if (phone.startsWith('9')) {
      phone = '7' + phone;
    }
    
    // Форматируем
    const match = phone.match(/^(\d{1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
    if (!match) return phone;
    
    const [_, code, a, b, c, d] = match;
    let formatted = `+7`;
    
    if (a) formatted += ` (${a}`;
    if (b) formatted += `) ${b}`;
    if (c) formatted += `-${c}`;
    if (d) formatted += `-${d}`;
    
    return formatted;
  };

  // Получение чистого номера
  const getCleanPhone = (formatted: string): string => {
    const cleaned = formatted.replace(/\D/g, '');
    return cleaned.startsWith('7') ? cleaned : '7' + cleaned;
  };

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
    if (!inputValue) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleChangeText = (text: string) => {
    // Сохраняем сырой ввод
    setInputValue(text);
    
    // Определяем режим
    const looksLikeEmail = isEmailLike(text);
    
    if (looksLikeEmail) {
      setIsPhoneMode(false);
      if (onChangeText) {
        onChangeText(text, text, false);
      }
    } else {
      // Пробуем форматировать как телефон
      const formatted = formatPhone(text);
      setInputValue(formatted);
      setIsPhoneMode(true);
      
      if (onChangeText) {
        const cleanNumber = getCleanPhone(formatted);
        onChangeText(cleanNumber, formatted, true);
      }
    }
  };

  // Инициализация
  useEffect(() => {
    if (value) {
      const looksLikeEmail = isEmailLike(value);
      if (looksLikeEmail) {
        setInputValue(value);
        setIsPhoneMode(false);
      } else {
        const formatted = formatPhone(value);
        setInputValue(formatted);
        setIsPhoneMode(true);
      }
      
      if (!isFocused) {
        animatedValue.setValue(1);
      }
    } else {
      setInputValue('');
      setIsPhoneMode(false);
    }
  }, [value]);

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
      <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
        <ThemedView lightColor='#03051E08' darkColor='#ECEFFA0D' style={[styles.container, style]}>
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
              Platform.OS === 'android' && styles.inputAndroid,
              inputStyle,
              { color },
            ])}
            placeholder=""
            placeholderTextColor="transparent"
            keyboardType={isPhoneMode ? 'phone-pad' : 'email-address'}
            value={inputValue}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            maxLength={isPhoneMode ? 18 : maxLength}
            textAlignVertical="center"
            autoCapitalize="none"
            autoCorrect={false}
            {...props}
            inputAccessoryViewID={
              showIosDoneAccessory
                ? iosDoneAccessoryId
                : props.inputAccessoryViewID
            }
          />
        </ThemedView>
      </TouchableWithoutFeedback>
      {showIosDoneAccessory ? (
        <InputAccessoryView nativeID={iosDoneAccessoryId}>
          <View style={styles.accessoryBar}>
            <TouchableOpacity
              onPress={Keyboard.dismiss}
              hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Готово"
            >
              <Text style={styles.accessoryDone}>Готово</Text>
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
    // backgroundColor: '#03051E08',
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
    paddingTop: 20,
    paddingBottom: 10,
  },
  inputAndroid: {
    paddingTop: Platform.OS === 'android' ? 25 : 25,
    paddingBottom: Platform.OS === 'android' ? 8 : 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  placeholder: {
    position: 'absolute',
    zIndex: 1,
    backgroundColor: 'transparent',
    includeFontPadding: false,
    pointerEvents: 'none',
    fontWeight: '400'
  },
  accessoryBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#D1D3D9',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.15)',
  },
  accessoryDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#203686',
  },
});

export default SmartInput;