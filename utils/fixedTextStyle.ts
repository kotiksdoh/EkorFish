import { Platform, StyleSheet, type StyleProp, type TextStyle } from 'react-native';

export const FIXED_TEXT_PROPS = {
  allowFontScaling: false,
} as const;

function mapFontWeightToMontserrat(weight?: TextStyle['fontWeight']): string {
  const normalized = weight?.toString().toLowerCase();

  if (normalized === '500' || normalized === 'medium') {
    return 'Montserrat-Medium';
  }
  if (normalized === '600' || normalized === 'semibold') {
    return 'Montserrat-SemiBold';
  }
  if (normalized === '700' || normalized === 'bold') {
    return 'Montserrat-Bold';
  }

  return 'Montserrat-Regular';
}

function resolveMontserratFamily(
  family: string | undefined,
  weight?: TextStyle['fontWeight'],
): string {
  if (!family || family === 'Montserrat') {
    return mapFontWeightToMontserrat(weight);
  }

  if (family.startsWith('Montserrat-')) {
    return family;
  }

  return family;
}

export function getFixedTextStyle(style?: StyleProp<TextStyle>): TextStyle {
  if (Platform.OS !== 'ios') {
    return StyleSheet.flatten(style) ?? {};
  }

  const flat = StyleSheet.flatten(style);

  if (!flat) {
    return {
      fontFamily: 'Montserrat-Regular',
      fontWeight: 'normal',
    };
  }

  const { fontWeight, fontFamily, ...rest } = flat;

  return {
    ...rest,
    fontFamily: resolveMontserratFamily(fontFamily, fontWeight),
    fontWeight: 'normal',
  };
}
