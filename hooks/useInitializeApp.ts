import * as SplashScreenExpo from "expo-splash-screen";
import { useEffect, useState } from "react";
// import { loadAppData } from '@/store/slices/appSlice';
import {
  getCategoryItems,
  getMyInfo,
  getMyParams,
  getSliderItems,
  setBootstrapStatus,
} from "@/features/auth/authSlice";
import { getCart, getMyOrders } from "@/features/catalog/catalogSlice";
import { store } from "@/store/store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const INIT_REQUEST_TIMEOUT_MS = 12000;

// Предотвращаем автоматическое скрытие сплеш-скрина
SplashScreenExpo.preventAutoHideAsync().catch(() => {
  /* ignore */
});

// Шрифты для загрузки (укажите ваши шрифты)

// Имитация загрузки данных
const loadAppResources = async () => {
  const withTimeout = async <T>(
    promise: Promise<T>,
    label: string,
  ): Promise<boolean> => {
    try {
      await Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`[Init] Timeout while loading ${label}`)),
            INIT_REQUEST_TIMEOUT_MS,
          ),
        ),
      ]);
      return true;
    } catch (error) {
      console.log(`[Init] Skip failed step "${label}":`, error);
      return false;
    }
  };

  try {
    store.dispatch(setBootstrapStatus("loading"));

    const token = await AsyncStorage.getItem("token");
    // 1. Загружаем шрифты

    // 2. Инициализируем данные приложения
    const categoriesOk = await withTimeout(
      store.dispatch(getCategoryItems("")).unwrap(),
      "categories",
    );
    const slidersOk = await withTimeout(
      store.dispatch(getSliderItems("")).unwrap(),
      "sliders",
    );
    if (token) {
      await withTimeout(store.dispatch(getMyInfo("")).unwrap(), "my-info");
      await withTimeout(store.dispatch(getMyParams("")).unwrap(), "params");
      await withTimeout(store.dispatch(getCart()).unwrap(), "cart");
      await withTimeout(store.dispatch(getMyOrders()).unwrap(), "orders");
    }
    // 3. Другие инициализации (если нужны)
    // - Кэширование изображений
    // - Загрузка конфигурации
    // - Проверка обновлений
    // - Инициализация аналитики
    // const testHttps = async () => {
    //   try {
    //     await axios.get("https://google.com", { timeout: 5000 });
    //     console.log("HTTPS работает! Проблема именно с HTTP");
    //   } catch (error: any) {
    //     console.log("HTTPS тоже не работает:", error.message);
    //   }
    // };

    // testHttps();
    store.dispatch(
      setBootstrapStatus(categoriesOk && slidersOk ? "ready" : "failed"),
    );

    // Имитация задержки для демонстрации сплеш-скрина
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return true;
  } catch (error) {
    console.error("Error loading app resources:", error);
    store.dispatch(setBootstrapStatus("failed"));
    return true;
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
          setError("Не удалось загрузить ресурсы приложения");
        }
      } catch (err) {
        console.error("App initialization error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    initializeApp();
  }, []);

  return { isReady, error };
};
