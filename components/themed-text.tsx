import { useThemeColor } from '@/hooks/use-theme-color';
import { FIXED_TEXT_PROPS, getFixedTextStyle } from '@/utils/fixedTextStyle';
import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'caption' | 'def';
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold'; // Добавляем weight prop
};

export function ThemedText({
  style,
  lightColor = '#1B1B1C',
  darkColor = '#FBFCFF',
  type = 'default',
  weight,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');


  const getFontFamily = () => {
    if (Platform.OS === 'ios') {
      switch (weight) {
        case 'medium':
          return 'Montserrat-Medium';
        case 'semiBold':
          return 'Montserrat-SemiBold';
        case 'bold':
          return 'Montserrat-Bold';
        default:
          return 'Montserrat-Regular';
      }
    } else {
      return 'Montserrat-Regular';
    }
  };

  const getFontWeight = () => {
    if (Platform.OS === 'ios') {
      return 'normal';
    } else {
      switch (weight) {
        case 'medium':
          return '500';
        case 'semiBold':
          return '600';
        case 'bold':
          return '700';
        default:
          return '400';
      }
    }
  };

  return (
    <Text
      {...FIXED_TEXT_PROPS}
      style={[
        getFixedTextStyle({
          color,
          fontFamily: getFontFamily(),
          fontWeight: getFontWeight(),
        }),
        type === 'def' ? getFixedTextStyle(styles.def) : undefined,
        type === 'default' ? getFixedTextStyle(styles.default) : undefined,
        type === 'title' ? getFixedTextStyle(styles.title) : undefined,
        type === 'defaultSemiBold' ? getFixedTextStyle(styles.defaultSemiBold) : undefined,
        type === 'subtitle' ? getFixedTextStyle(styles.subtitle) : undefined,
        type === 'link' ? getFixedTextStyle(styles.link) : undefined,
        type === 'caption' ? getFixedTextStyle(styles.caption) : undefined,
        getFixedTextStyle(style),
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  def: {
    fontSize: 16,

  },
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: Platform.OS === 'ios' ? 'normal' : 'normal', 
    fontFamily: Platform.OS === 'ios' ? 'Montserrat-SemiBold' : 'Montserrat-Regular',
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: Platform.OS === 'ios' ? 'normal' : 'normal',
    fontFamily: Platform.OS === 'ios' ? 'Montserrat-Bold' : 'Montserrat-Regular',
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: Platform.OS === 'ios' ? 'normal' : 'normal',
    fontFamily: Platform.OS === 'ios' ? 'Montserrat-SemiBold' : 'Montserrat-Regular',
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    color: '#0a7ea4',
    textDecorationLine: 'underline',
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});