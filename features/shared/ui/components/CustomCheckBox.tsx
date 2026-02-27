import { useThemeColor } from '@/hooks/use-theme-color';
import { StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';

export const CustomCheckbox = ({ style, value, onValueChange, lightColor, darkColor, disabled }) => {

  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  // const borderColor =  useThemeColor({ light: borderLightColor, dark: borderDarkColor }, '');
  const systemTheme = useColorScheme(); 
  //TODO
  const currentTheme = systemTheme || 'light'
  return (
    <TouchableOpacity
      style={[
      { backgroundColor,
        borderColor: currentTheme === 'dark' ? '#323235' : 'transparent',
       },
        styles.customCheckbox,
        value && styles.customCheckboxChecked
      ]}
      onPress={() => onValueChange(!value)}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      {value && <View style={styles.checkmark} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  customCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    // borderColor: '#323235',
    // backgroundColor: '#F2F4F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customCheckboxChecked: {
    backgroundColor: '#203686',
    borderColor: '#203686',
  },
  checkmark: {
    width: 12,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
  },
});