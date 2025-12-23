import { MenuIcon, ScannerIcon, SearchIcon } from '@/assets/icons/icons';
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface SearchInputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onScannerPress?: () => void;
  onMenuPress?: () => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value = '',
  onChangeText,
  placeholder = 'Найти товары',
  disabled = false,
  onScannerPress,
  onMenuPress,
}) => {
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
        <TouchableOpacity
          style={[styles.scannerButton, disabled && styles.buttonDisabled]}
          onPress={onScannerPress}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <ScannerIcon stroke={disabled ? '#A0A0A0' : '#80818B'} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={[styles.menuButton, disabled && styles.menuButtonDisabled]}
        onPress={onMenuPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <MenuIcon stroke={disabled ? '#A0A0A0' : '#1B1B1C'} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // marginTop: 16,
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
    borderWidth: 1,
    borderColor: '#E4E4E7',
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
    backgroundColor: '#F2F4F7',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 1,
    paddingHorizontal: 12,
  },
  menuButtonDisabled: {
    backgroundColor: '#F0F0F0',
    opacity: 0.5,
  },
});

export default SearchInput;
