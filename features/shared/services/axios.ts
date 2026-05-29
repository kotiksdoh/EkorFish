import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// export const baseUrl = `http://192.168.222.229:9191`; // Локалка
// export const baseUrl = `http://192.168.222.239:13333`;
export const baseUrl = `https://api.ekorfish.ru`; // Домен
// export const baseUrl = `http://192.168.222.238:13333`; // Сервер
// 192.168.222.239:13333/swagger/index.html

function isRefreshTokenRequest(
  config: { url?: string; baseURL?: string } | undefined,
): boolean {
  if (!config?.url) return false;
  const path = config.url.toLowerCase();
  return path.includes("refresh-token");
}

function extractTokens(payload: any): {
  accessToken?: string;
  refreshToken?: string;
} {
  if (!payload) return {};

  if (payload?.data?.accessToken || payload?.data?.refreshToken) {
    return {
      accessToken: payload.data.accessToken,
      refreshToken: payload.data.refreshToken,
    };
  }

  if (payload?.accessToken || payload?.refreshToken) {
    return {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    };
  }

  if (payload?.access_token || payload?.refresh_token) {
    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
    };
  }

  return {};
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
    console.log(
      `[AXIOS][REQUEST] ${String(config.method).toUpperCase()} ${config.baseURL ?? ""}${config.url ?? ""} | token=${token ? "present" : "missing"}`,
    );
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
    const status = error?.response?.status;
    const requestUrl = `${originalRequest?.baseURL ?? ""}${originalRequest?.url ?? ""}`;
    console.log(
      `[AXIOS][RESPONSE_ERROR] status=${status ?? "no_response"} url=${requestUrl} code=${error?.code ?? "unknown"} retry=${originalRequest?._retry ? "yes" : "no"}`,
    );

    /** Сетевые сбои (ERR_NETWORK, ERR_CONNECTION_REFUSED, ECONNREFUSED и т.д.) — нет HTTP-ответа, это не 401. */
    if (!error.response) {
      console.log("[AXIOS][RESPONSE_ERROR] skipped refresh: no HTTP response");
      return Promise.reject(error);
    }

    if (
      error.response.status === 401 &&
      originalRequest &&
      !isRefreshTokenRequest(originalRequest) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      console.log(`[AXIOS][401] refresh flow started for ${requestUrl}`);
      try {
        const refreshToken = await AsyncStorage.getItem("token_refresh");
        console.log(
          `[AXIOS][401] refresh token in storage: ${refreshToken ? "present" : "missing"}`,
        );
        if (!refreshToken) {
          console.log("[AXIOS][401] refresh aborted: missing token_refresh, clearing session");
          await AsyncStorage.multiRemove(["token", "token_refresh", "user"]);
          return Promise.reject(error);
        }

        console.log("[AXIOS][401] calling /api/Account/refresh-token");
        const { data } = await axios.post(
          `${baseUrl}/api/Account/refresh-token`,
          { refreshToken },
        );
        console.log("[AXIOS][401] refresh response received", data);

        const nextTokens = extractTokens(data);
        console.log(
          `[AXIOS][401] parsed tokens: access=${nextTokens.accessToken ? "yes" : "no"} refresh=${nextTokens.refreshToken ? "yes" : "no"}`,
        );
        if (!nextTokens.accessToken || !nextTokens.refreshToken) {
          console.log("[AXIOS][401] refresh aborted: cannot parse tokens, clearing session");
          await AsyncStorage.multiRemove(["token", "token_refresh", "user"]);
          return Promise.reject(error);
        }

        await AsyncStorage.setItem("token", nextTokens.accessToken);
        await AsyncStorage.setItem("token_refresh", nextTokens.refreshToken);

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${nextTokens.accessToken}`;
        console.log(`[AXIOS][401] retrying original request ${requestUrl}`);
        return axdef(originalRequest);
      } catch (err) {
        console.log("[AXIOS][401] refresh failed, clearing session", err);
        await AsyncStorage.multiRemove(["token", "token_refresh", "user"]);
        return Promise.reject(err);
      }
    }

    if (error.response.status === 401) {
      console.log(
        `[AXIOS][401] refresh skipped for ${requestUrl}: isRefresh=${isRefreshTokenRequest(originalRequest)} retry=${originalRequest?._retry ? "yes" : "no"}`,
      );
    }

    return Promise.reject(error);
  },
);
