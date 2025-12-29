import { CalendarFilledIcon } from '@/assets/icons/icons';
import { ThemedView } from '@/components/themed-view'; // Добавьте этот импорт
import { useThemeColor } from '@/hooks/use-theme-color';
import React, { useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback
} from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";

interface DatePickerWithIconProps {
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

export const DatePickerWithIcon: React.FC<DatePickerWithIconProps> = ({
  placeholder = "Дата рождения",
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
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const animatedValue = useState(new Animated.Value(value ? 1 : 0))[0];
  const inputRef = useRef<TextInput>(null);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (selectedDate: Date) => {
    const formattedDate = selectedDate.toLocaleDateString('ru-RU');
    if (onChangeText) {
      onChangeText(formattedDate);
    }
    
    // Анимация placeholder
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    
    hideDatePicker();
  };

  const handleFocus = () => {
    setIsFocused(true);
    showDatePicker(); // Показываем date picker при фокусе
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
    <TouchableWithoutFeedback onPress={showDatePicker}>
      <ThemedView 
        style={[styles.container, style]}
        lightColor='#03051E08'
        darkColor='#ECEFFA0D'
      >
        <Animated.Text style={[styles.placeholder, animatedStyle]}>
          {placeholder}
        </Animated.Text>
        
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            inputStyle,
            { 
              paddingTop: 20,
              paddingBottom: 10,
              color: color,
              paddingRight: 40, 
            }
          ]}
          placeholder=""
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength}
          textAlignVertical="center"
          editable={false} 
          pointerEvents="none" 
          {...props}
        />
        
        <TouchableOpacity 
          onPress={showDatePicker} 
          style={styles.iconContainer}
          activeOpacity={0.7}
        >
          <CalendarFilledIcon width={20} height={20} />
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
          maximumDate={new Date()} // Нельзя выбрать будущую дату для рождения
          locale="ru_RU"
          cancelTextIOS="Отмена"
          confirmTextIOS="Выбрать"
        //   headerTextIOS="Выберите дату"
        />
      </ThemedView>
    </TouchableWithoutFeedback>
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
  },
  placeholder: {
    position: 'absolute',
    zIndex: 1,
    backgroundColor: 'transparent',
    includeFontPadding: false,
    fontWeight: '500',
    pointerEvents: 'none', // Добавьте эту строку
  },
  iconContainer: {
    position: 'absolute',
    right: 12,
    padding: 8,
    zIndex: 2,
  },
});