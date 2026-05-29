// app/_layout.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SplashScreen } from '@/features/shared/ui/components/splash-screen';
import { buildAppToastConfig } from '@/features/shared/ui/appToastConfig';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCrashlytics, useCrashlyticsUser } from '@/hooks/useCrashlytics';
import { useInitializeApp } from '@/hooks/useInitializeApp';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { ThemeProvider as AppThemeProvider } from '@/contexts/ThemeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { store } from '@/store/store';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet } from 'react-native';
import 'react-native-reanimated';
import { Provider } from 'react-redux';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import ToastManager from 'toastify-react-native';
import '../global.css';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppToastHost() {
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';
  const toastConfig = useMemo(() => buildAppToastConfig(isDark), [isDark]);

  return (
    <ToastManager
      config={toastConfig}
      useModal={true}
      position="bottom"
      bottomOffset={12 + insets.bottom}
      topOffset={10 + insets.top}
      duration={4200}
      showProgressBar={false}
      showCloseIcon={false}
      animationStyle="slide"
      width="92%"
      minHeight={64}
      theme={isDark ? 'dark' : 'light'}
    />
  );
}

function CrashlyticsUserSync() {
  useCrashlyticsUser();
  return null;
}

function RootLayoutContent() {
  const { currentTheme } = useTheme();
  const navigationTheme = currentTheme === 'dark' ? DarkTheme : DefaultTheme;
  
  return (
    <NavigationThemeProvider value={navigationTheme}>
      <SafeAreaProvider>
        <Provider store={store}>
          <CrashlyticsUserSync />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
          <AppToastHost />
        </Provider>
      </SafeAreaProvider>
    </NavigationThemeProvider>
  );
}

function AppContent() {
  const { isReady, error } = useInitializeApp();
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  useCrashlytics();
  usePushNotifications();

  const handleSplashComplete = () => {
    setIsSplashVisible(false);
  };

  if (isSplashVisible) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  if (!isReady) {
    return (
      <ThemedView style={stylesLoad.loadingContainer}>
        <ActivityIndicator size="large" color="#203686" />
        <ThemedText style={stylesLoad.loadingText}>Загрузка...</ThemedText>
      </ThemedView>
    );
  }
  
  if (error) {
    return (
      <ThemedView style={stylesLoad.errorContainer}>
        <ThemedText style={stylesLoad.errorText}>Ошибка: {error}</ThemedText>
        <Button
          title="Повторить"
          onPress={() => {/* логика повтора */}}
        />
      </ThemedView>
    );
  }

  return <RootLayoutContent />;
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AppContent />
    </AppThemeProvider>
  );
}

const stylesLoad = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
});