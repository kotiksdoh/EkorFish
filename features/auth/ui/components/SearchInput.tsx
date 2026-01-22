import { MenuIcon, ScannerIcon, SearchIcon } from '@/assets/icons/icons';
import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';

interface SearchInputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onScannerPress?: () => void;
  onMenuPress?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  isActiveButton?: boolean;
  isHeader?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value = '',
  onChangeText,
  placeholder = 'Найти товары',
  disabled = false,
  onScannerPress,
  onMenuPress,
  theme = 'auto', 
  isActiveButton = true,
  isHeader
}) => {
  const systemTheme = useColorScheme(); // Получаем системную тему
  const currentTheme = theme === 'auto' ? systemTheme : theme;
  const isDarkMode = currentTheme === 'dark';
  
  // Определяем цвета для разных тем
  const menuButtonBg = isDarkMode ? '#202022' : '#F2F4F7'; // В темной теме белая кнопка, в светлой - темная
  const menuIconColor = isDarkMode ? '#FFFFFF' : '#202022'; // В темной теме черная иконка, в светлой - белая
  const menuIconDisabledColor = '#A0A0A0'; // Серый для disabled состояния
  
  return (

    <View style={styles.container}>
      {/* Основной контейнер поиска */}
      <View style={[styles.searchContainer, disabled && styles.disabled]}>
        {/* Иконка поиска слева */}
        <View style={styles.searchIcon}>
          <SearchIcon stroke={disabled ? '#A0A0A0' : '#80818B'} />
        </View>
        
        {/* Поле ввода */}
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={disabled ? '#A0A0A0' : '#80818B'}
          editable={!disabled}
          selectionColor="#80818B"
        />
        
        {/* Иконка сканера справа */}
        {/* {isActiveButton ? */}
        <TouchableOpacity
          style={[styles.scannerButton, disabled && styles.buttonDisabled]}
          onPress={onScannerPress}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <ScannerIcon stroke={disabled ? '#A0A0A0' : '#80818B'} />
        </TouchableOpacity>
        {/* // : <></>
        // } */}
      </View>
      
      {/* Кнопка меню (бургер) */}
      {isActiveButton ?
      <TouchableOpacity
        style={[
          styles.menuButton, 
          { backgroundColor: menuButtonBg },
          disabled && styles.menuButtonDisabled
        ]}
        onPress={onMenuPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <MenuIcon 
          stroke={disabled ? menuIconDisabledColor : menuIconColor}
        />
      </TouchableOpacity>
      : <></>
      }
    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#03051E08',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
  },
  disabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1B1B1C',
    fontFamily: 'System',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  inputDisabled: {
    color: '#A0A0A0',
  },
  scannerButton: {
    padding: 4,
    marginLeft: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonDisabled: {
    opacity: 0.5,
  },
});

export default SearchInput;