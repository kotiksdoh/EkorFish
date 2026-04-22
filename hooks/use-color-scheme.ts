import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export function useColorScheme() {
  const systemScheme = useSystemColorScheme();

  try {
    const { currentTheme } = useTheme();
    return currentTheme;
  } catch {
    return systemScheme;
  }
}
