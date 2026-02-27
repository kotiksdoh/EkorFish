import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  ref?: any;
};
// TODO
export function ThemedView({ style, lightColor, darkColor,ref, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View ref={ref} style={[{ backgroundColor }, style]} {...otherProps} />;
}
