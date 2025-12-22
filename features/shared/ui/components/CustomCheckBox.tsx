import { StyleSheet, TouchableOpacity, View } from 'react-native';

export const CustomCheckbox = ({ style, value, onValueChange }) => {
  return (
    <TouchableOpacity
      style={[
        styles.customCheckbox,
        value && styles.customCheckboxChecked
      ]}
      onPress={() => onValueChange(!value)}
      activeOpacity={0.7}
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
    borderColor: '#D8DADE',
    backgroundColor: '#F2F4F7',
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