import * as SplashScreenExpo from 'expo-splash-screen';
import { useEffect, useState } from 'react';
// import { loadAppData } from '@/store/slices/appSlice';
import { getCategoryItems, getMyInfo, getSliderItems } from '@/features/auth/authSlice';
import { store } from '@/store/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCart } from '@/features/catalog/catalogSlice';

// Предотвращаем автоматическое скрытие сплеш-скрина
SplashScreenExpo.preventAutoHideAsync().catch(() => {
  /* ignore */
});

// Шрифты для загрузки (укажите ваши шрифты)


// Имитация загрузки данных
const loadAppResources = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    // 1. Загружаем шрифты

    // 2. Инициализируем данные приложения
    await store.dispatch(getSliderItems('')).unwrap();
    await store.dispatch(getCategoryItems('')).unwrap();
    if(token){
      await store.dispatch(getMyInfo('')).unwrap();
      await store.dispatch(getCart()).unwrap();
    }
    // 3. Другие инициализации (если нужны)
    // - Кэширование изображений
    // - Загрузка конфигурации
    // - Проверка обновлений
    // - Инициализация аналитики

    // Имитация задержки для демонстрации сплеш-скрина
    await new Promise(resolve => setTimeout(resolve, 1000));

    return true;
  } catch (error) {
    console.error('Error loading app resources:', error);
    return false;
  }
};

export const useInitializeApp = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Загружаем все ресурсы
        const success = await loadAppResources();
        
        if (success) {
          setIsReady(true);
          // Скрываем сплеш-скрин Expo
          await SplashScreenExpo.hideAsync();
        } else {
          setError('Не удалось загрузить ресурсы приложения');
        }
      } catch (err) {
        console.error('App initialization error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initializeApp();
  }, []);

  return { isReady, error };
};