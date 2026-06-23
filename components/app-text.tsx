import { FIXED_TEXT_PROPS, getFixedTextStyle } from '@/utils/fixedTextStyle';
import { Text, type TextProps } from 'react-native';

export function AppText({ style, ...rest }: TextProps) {
  return <Text {...FIXED_TEXT_PROPS} style={getFixedTextStyle(style)} {...rest} />;
}
