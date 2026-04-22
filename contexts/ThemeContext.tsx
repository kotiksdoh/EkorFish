// contexts/ThemeContext.tsx
import * as React from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextType = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  currentTheme: 'light' | 'dark';
};

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);
const canOverrideAppearance =
  typeof (Appearance as { setColorScheme?: (scheme: 'light' | 'dark' | null) => void }).setColorScheme === 'function';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = React.useState<ThemeMode>('system');
  const deviceTheme = useColorScheme() ?? 'light';

  React.useEffect(() => {
    loadThemeMode();
  }, []);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('theme_mode');
      if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
        setThemeModeState(savedMode);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem('theme_mode', mode);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const currentTheme = themeMode === 'system' ? deviceTheme : themeMode;

  React.useEffect(() => {
    if (!canOverrideAppearance) {
      return;
    }

    // Keep React Native color scheme in sync with app-level override.
    if (themeMode === 'system') {
      Appearance.setColorScheme(null);
      return;
    }

    Appearance.setColorScheme(themeMode);
  }, [themeMode]);

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}