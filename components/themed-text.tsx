import { useThemeColor } from '@/hooks/use-theme-color';
import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'caption';
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold'; // Добавляем weight prop
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  weight,
  ...rest
}: ThemedTextProps) {
  // TODO
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
      style={[
        { 
          color,
          fontFamily: getFontFamily(),
          fontWeight: getFontWeight(),
        },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'caption' ? styles.caption : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: Platform.OS === 'ios' ? '600' : 'normal', 
    fontFamily: Platform.OS === 'ios' ? 'Montserrat-SemiBold' : 'Montserrat-Regular',
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
    fontFamily: Platform.OS === 'ios' ? 'Montserrat-Bold' : 'Montserrat-Regular',
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: Platform.OS === 'ios' ? '600' : 'normal',
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