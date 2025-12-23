import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { store } from '@/store/store';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import 'react-native-reanimated';
import { Provider } from 'react-redux';
import ToastManager from 'toastify-react-native';
import '../global.css';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const toastConfig = {
    success: ({ text1, text2, ...rest }: any) => (
      <ThemedView 
        style={[styles.toastContainer, styles.successToast]}
        lightColor="#d4edda"
        darkColor="#155724"
      >
        <ThemedText 
          type="defaultSemiBold" 
          style={styles.toastTitle}
          lightColor="#155724"
          darkColor="#d4edda"
        >
          ✓ {text1}
        </ThemedText>
        {text2 && (
          <ThemedText 
            type="default" 
            style={styles.toastMessage}
            lightColor="#155724"
            darkColor="#d4edda"
          >
            {text2}
          </ThemedText>
        )}
      </ThemedView>
    ),
    error: ({ text1, text2, ...rest }: any) => (
      <ThemedView 
        style={[styles.toastContainer, styles.errorToast]}
        lightColor="#f8d7da"
        darkColor="#721c24"
      >
        <ThemedText 
          type="defaultSemiBold" 
          style={styles.toastTitle}
          lightColor="#721c24"
          darkColor="#f8d7da"
        >
          ✗ {text1}
        </ThemedText>
        {text2 && (
          <ThemedText 
            type="default" 
            style={styles.toastMessage}
            lightColor="#721c24"
            darkColor="#f8d7da"
          >
            {text2}
          </ThemedText>
        )}
      </ThemedView>
    ),
    info: ({ text1, text2, ...rest }: any) => (
      <ThemedView 
        style={[styles.toastContainer, styles.infoToast]}
        lightColor="#d1ecf1"
        darkColor="#0c5460"
      >
        <ThemedText 
          type="defaultSemiBold" 
          style={styles.toastTitle}
          lightColor="#0c5460"
          darkColor="#d1ecf1"
        >
          ℹ {text1}
        </ThemedText>
        {text2 && (
          <ThemedText 
            type="default" 
            style={styles.toastMessage}
            lightColor="#0c5460"
            darkColor="#d1ecf1"
          >
            {text2}
          </ThemedText>
        )}
      </ThemedView>
    ),
    warning: ({ text1, text2, ...rest }: any) => (
      <ThemedView 
        style={[styles.toastContainer, styles.warningToast]}
        lightColor="#fff3cd"
        darkColor="#856404"
      >
        <ThemedText 
          type="defaultSemiBold" 
          style={styles.toastTitle}
          lightColor="#856404"
          darkColor="#fff3cd"
        >
          ⚠ {text1}
        </ThemedText>
        {text2 && (
          <ThemedText 
            type="default" 
            style={styles.toastMessage}
            lightColor="#856404"
            darkColor="#fff3cd"
          >
            {text2}
          </ThemedText>
        )}
      </ThemedView>
    ),
  };
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Provider store={store}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
      <ToastManager config={toastConfig}/>
      </Provider>
    </ThemeProvider>
  );
}
const styles = StyleSheet.create({
  toastManager: {
    width: '90%',
    alignSelf: 'center',
  },
  toastContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
  },
  successToast: {
    borderLeftColor: '#28a745',
  },
  errorToast: {
    borderLeftColor: '#dc3545',
  },
  infoToast: {
    borderLeftColor: '#17a2b8',
  },
  warningToast: {
    borderLeftColor: '#ffc107',
  },
  toastTitle: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '600',
  },
  toastMessage: {
    fontSize: 13,
    opacity: 0.9,
  },
  toastText: {
    fontSize: 14,
  },
});