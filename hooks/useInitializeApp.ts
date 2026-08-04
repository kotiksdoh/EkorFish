import * as SplashScreenExpo from "expo-splash-screen";
import { useEffect, useState } from "react";
// import { loadAppData } from '@/store/slices/appSlice';
import {
  clearAuthState,
  flushPendingStorageId,
  getCategoryItems,
  getMyInfo,
  getMyParams,
  getSearchHints,
  getSliderItems,
  hydratePendingStorageId,
  setBootstrapStatus,
} from "@/features/auth/authSlice";
import { registerSessionClearedHandler } from "@/features/auth/services/clearAuthSession";
import {
  clearCatalogState,
  getCart,
  getMyOrders,
  getOrderPageData,
} from "@/features/catalog/catalogSlice";
import { store } from "@/store/store";
import { loadMontserratFonts } from "@/utils/loadMontserratFonts";
import AsyncStorage from "@react-native-async-storage/async-storage";

const INIT_REQUEST_TIMEOUT_MS = 12000;

registerSessionClearedHandler(() => {
  store.dispatch(clearAuthState());
  store.dispatch(clearCatalogState());
});

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
    await withTimeout(loadMontserratFonts(), "fonts");

    // Инициализируем данные приложения
    const categoriesOk = await withTimeout(
      store.dispatch(getCategoryItems("")).unwrap(),
      "categories",
    );
    const slidersOk = await withTimeout(
      store.dispatch(getSliderItems("")).unwrap(),
      "sliders",
    );
    await withTimeout(store.dispatch(getSearchHints()).unwrap(), "search-hints");
    await withTimeout(
      store.dispatch(hydratePendingStorageId()).unwrap(),
      "pending-town",
    );
    if (token) {
      await withTimeout(store.dispatch(getMyInfo("")).unwrap(), "my-info");
      await withTimeout(
        store.dispatch(flushPendingStorageId()).unwrap(),
        "flush-pending-town",
      );
      await withTimeout(store.dispatch(getMyParams("")).unwrap(), "params");
      await withTimeout(store.dispatch(getCart()).unwrap(), "cart");
      await withTimeout(store.dispatch(getMyOrders()).unwrap(), "orders");
      await withTimeout(
        store.dispatch(getOrderPageData()).unwrap(),
        "order-page-data",
      );
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
