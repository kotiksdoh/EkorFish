import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

export const FIXED_TEXT_PROPS = {
  allowFontScaling: false,
} as const;

const MONTSERRAT_REGULAR = 'Montserrat-Regular';
const MONTSERRAT_MEDIUM = 'Montserrat-Medium';
const MONTSERRAT_SEMIBOLD = 'Montserrat-SemiBold';
const MONTSERRAT_BOLD = 'Montserrat-Bold';

function normalizeFontWeight(weight?: TextStyle['fontWeight']): string {
  if (weight == null) {
    return '400';
  }

  const normalized = weight.toString().toLowerCase();
  if (normalized === 'normal') {
    return '400';
  }

  return normalized;
}

function mapFontWeightToMontserrat(weight?: TextStyle['fontWeight']): string {
  const normalized = normalizeFontWeight(weight);

  if (normalized === '500' || normalized === 'medium') {
    return MONTSERRAT_MEDIUM;
  }
  if (normalized === '600' || normalized === 'semibold') {
    return MONTSERRAT_SEMIBOLD;
  }
  if (
    normalized === '700' ||
    normalized === 'bold' ||
    normalized === '800' ||
    normalized === '900'
  ) {
    return MONTSERRAT_BOLD;
  }

  return MONTSERRAT_REGULAR;
}

function resolveMontserratFamily(
  family: string | undefined,
  weight?: TextStyle['fontWeight'],
): string {
  const weightFamily = mapFontWeightToMontserrat(weight);

  if (!family || family === 'Montserrat') {
    return weightFamily;
  }

  if (family.startsWith('Montserrat-')) {
    if (weight == null) {
      return family;
    }

    return weightFamily;
  }

  return family;
}

export function getFixedTextStyle(style?: StyleProp<TextStyle>): TextStyle {
  const flat = StyleSheet.flatten(style);

  if (!flat) {
    return {
      fontFamily: MONTSERRAT_REGULAR,
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

export const getFixedTextInputStyle = getFixedTextStyle;

export function weightPropToFontWeight(
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold',
): TextStyle['fontWeight'] | undefined {
  switch (weight) {
    case 'medium':
      return '500';
    case 'semiBold':
      return '600';
    case 'bold':
      return '700';
    case 'regular':
      return '400';
    default:
      return undefined;
  }
}
