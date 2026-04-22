import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();
  let currentTheme: 'light' | 'dark' | undefined;

  try {
    currentTheme = useTheme().currentTheme;
  } catch {
    currentTheme = undefined;
  }

  if (currentTheme) {
    return currentTheme;
  }

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
