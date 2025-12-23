// features/auth/components/CodeInput.tsx
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import {
    StyleProp,
    StyleSheet,
    TextInput,
    TextInputProps,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';

interface CodeInputProps extends Omit<TextInputProps, 'style' | 'onChangeText'> {
  length: number;
  value: string;
  onChangeText: (code: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  error?: boolean;
  autoFocus?: boolean;
}

export interface CodeInputRef {
  focus: () => void;
  clear: () => void;
}

export const CodeInput = forwardRef<CodeInputRef, CodeInputProps>(({
  length = 4,
  value,
  onChangeText,
  containerStyle,
  inputStyle,
  textStyle,
  error = false,
  autoFocus = false,
  ...restProps
}, ref) => {
  const inputRefs = useRef<TextInput[]>([]);
  const codeDigitsArray = new Array(length).fill(0);

  useImperativeHandle(ref, () => ({
    focus: () => {
      const emptyIndex = value.split('').findIndex(digit => !digit);
      const indexToFocus = emptyIndex === -1 ? 0 : emptyIndex;
      inputRefs.current[indexToFocus]?.focus();
    },
    clear: () => {
      onChangeText('');
      inputRefs.current[0]?.focus();
    }
  }));

  // Фокусировка на первом поле при монтировании
  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [autoFocus]);

  const handleOnChangeText = (text: string, index: number) => {
    // Ограничиваем ввод одним символом
    const newText = text.length > 1 ? text.charAt(text.length - 1) : text;
    
    // Обновляем значение
    const currentCode = value.split('');
    currentCode[index] = newText;
    const newCode = currentCode.join('');
    
    onChangeText(newCode);

    // Автоматически переходим к следующему полю
    if (newText && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Если удалили символ - переходим к предыдущему полю
    if (!newText && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOnKeyPress = (e: any, index: number) => {
    // Обработка нажатия Backspace
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const renderInput = (index: number) => {
    const digit = value[index] || '';
    const isFilled = digit !== '';
    
    return (
      <View
        key={index}
        style={[
          styles.inputContainer,
          inputStyle,
          error && styles.inputError,
          isFilled && styles.inputFilled,
        ]}
      >
        <TextInput
          ref={ref => {
            inputRefs.current[index] = ref!;
          }}
          style={[
            styles.input,
            textStyle,
            error && styles.textError,
          ]}
          value={digit}
          onChangeText={text => handleOnChangeText(text, index)}
          onKeyPress={e => handleOnKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={1}
          textAlign="center"
          placeholder="•"
          placeholderTextColor={error ? '#FF3B30' : '#80818B'}
          selectionColor="#203686"
          autoFocus={index === 0 && autoFocus}
          caretHidden={true}
          {...restProps}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {codeDigitsArray.map((_, index) => renderInput(index))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  inputContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F2F4F7',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  input: {
    width: '100%',
    height: '100%',
    fontSize: 24,
    fontWeight: '600',
    color: '#1B1B1C',
    textAlign: 'center',
  },
  inputFilled: {
    backgroundColor: '#E8F0FE',
  },
  inputError: {
    backgroundColor: '#FF3B3010',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  textError: {
    color: '#FF3B30',
  },
});