import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// export const baseUrl = `http://192.168.222.205:9191`; // Локалка
// export const baseUrl = `http://192.168.222.239:13333`;
export const baseUrl = `https://ekortest.bitoobit.ru`; // Домен
// export const baseUrl = `http://192.168.222.238:13333`; // Сервер
// 192.168.222.239:13333/swagger/index.html

function isRefreshTokenRequest(
  config: { url?: string; baseURL?: string } | undefined,
): boolean {
  if (!config?.url) return false;
  const path = config.url.toLowerCase();
  return path.includes("refresh-token");
}

export const ax = axios.create();

ax.defaults.baseURL = baseUrl;

ax.interceptors.request.use(async (config) => {
  config.headers["Content-Type"] = "application/json";
  return config;
});

ax.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !isRefreshTokenRequest(originalRequest) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          `${baseUrl}/api/Account/refresh-token`,
          null,
        );
        await AsyncStorage.setItem("token", data.access_token);
        await AsyncStorage.setItem("token_refresh", data.refresh_token);
        return ax(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);

export const axdef = axios.create();
axdef.defaults.baseURL = baseUrl;

axdef.interceptors.request.use(async (config) => {
  config.headers["Content-Type"] = "application/json";
  try {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  } catch (e) {
    console.error("Error getting token from AsyncStorage:", e);
  }
  return config;
});

axdef.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    /** Сетевые сбои (ERR_NETWORK, ERR_CONNECTION_REFUSED, ECONNREFUSED и т.д.) — нет HTTP-ответа, это не 401. */
    if (!error.response) {
      return Promise.reject(error);
    }

    if (
      error.response.status === 401 &&
      originalRequest &&
      !isRefreshTokenRequest(originalRequest) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem("token_refresh");
        if (!refreshToken) {
          await AsyncStorage.multiRemove(["token", "token_refresh", "user"]);
          return Promise.reject(error);
        }

        const { data } = await axios.post(
          `${baseUrl}/api/Account/refresh-token`,
          { refreshToken },
        );

        await AsyncStorage.setItem("token", data.data.accessToken);
        await AsyncStorage.setItem("token_refresh", data.data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return axdef(originalRequest);
      } catch (err) {
        await AsyncStorage.multiRemove(["token", "token_refresh", "user"]);
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);
