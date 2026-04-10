// hooks/use-theme-color.ts
/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const { currentTheme } = useTheme();
  const colorFromProps = props[currentTheme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[currentTheme][colorName];
  }
}

// Экспортируем useAppTheme
export function useAppTheme() {
  const { themeMode, setThemeMode, currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';
  
  return {
    theme: currentTheme,
    currentTheme,
    isDark,
    themeMode,
    setThemeMode,
  };
}

// Также экспортируем useThemeSwitcher для удобства
export function useThemeSwitcher() {
  const { themeMode, setThemeMode, currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';
  
  return {
    themeMode,
    currentTheme,
    isDark,
    setLightTheme: () => setThemeMode('light'),
    setDarkTheme: () => setThemeMode('dark'),
    setSystemTheme: () => setThemeMode('system'),
  };
}