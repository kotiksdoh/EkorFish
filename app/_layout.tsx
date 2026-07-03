// app/_layout.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppToastHost } from '@/features/shared/ui/AppToastHost';
import { SplashScreen } from '@/features/shared/ui/components/splash-screen';
import { useCrashlytics, useCrashlyticsUser } from '@/hooks/useCrashlytics';
import { useBiometricUnlock } from '@/hooks/useBiometricUnlock';
import { useInitializeApp } from '@/hooks/useInitializeApp';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { store } from '@/store/store';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '@/utils/configureTextAccessibility';
import '../global.css';

export const unstable_settings = {
  anchor: '(tabs)',
};

function CrashlyticsUserSync() {
  useCrashlyticsUser();
  return null;
}

function RootLayoutContent() {
  const { currentTheme } = useTheme();
  const navigationTheme = currentTheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <CrashlyticsUserSync />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

function AppContent() {
  const { isReady, error } = useInitializeApp();
  const { isRequired, isUnlocked, isChecking, retry } = useBiometricUnlock(isReady);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  useCrashlytics();
  usePushNotifications();

  const handleSplashComplete = () => {
    setIsSplashVisible(false);
  };

  const readyToDismiss =
    isReady && !isChecking && (!isRequired || isUnlocked);

  if (isSplashVisible) {
    return (
      <SplashScreen
        readyToDismiss={readyToDismiss}
        onAnimationComplete={handleSplashComplete}
        onRetry={retry}
        showRetryHint={isRequired && !isUnlocked && isReady && !isChecking}
      />
    );
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
      <SafeAreaProvider>
        <Provider store={store}>
          <View style={stylesLoad.appRoot}>
            <AppContent />
            <AppToastHost />
          </View>
        </Provider>
      </SafeAreaProvider>
    </AppThemeProvider>
  );
}

const stylesLoad = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
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
