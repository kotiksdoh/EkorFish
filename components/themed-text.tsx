import { useThemeColor } from '@/hooks/use-theme-color';
import {
  FIXED_TEXT_PROPS,
  getFixedTextStyle,
  weightPropToFontWeight,
} from '@/utils/fixedTextStyle';
import { StyleSheet, Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'caption' | 'def';
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold';
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

  const typeStyle =
    type === 'def'
      ? styles.def
      : type === 'default'
        ? styles.default
        : type === 'title'
          ? styles.title
          : type === 'defaultSemiBold'
            ? styles.defaultSemiBold
            : type === 'subtitle'
              ? styles.subtitle
              : type === 'link'
                ? styles.link
                : type === 'caption'
                  ? styles.caption
                  : styles.default;

  return (
    <Text
      {...FIXED_TEXT_PROPS}
      style={getFixedTextStyle([
        { color },
        typeStyle,
        weight ? { fontWeight: weightPropToFontWeight(weight) } : undefined,
        style,
      ])}
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
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
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
