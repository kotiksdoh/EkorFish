// import { openNotification } from "../helpers/notifications";
import { showAppToast } from "./appToast";
import {
  SESSION_EXPIRED_MESSAGE,
  showSessionExpiredToast,
} from "./sessionExpiredToast";
import {
  ax,
} from "./axios";

function collectStringMessages(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectStringMessages);
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectStringMessages);
  }

  return [];
}

const NETWORK_ERROR_MESSAGE = "Нет подключения к серверу";

export { SESSION_EXPIRED_MESSAGE, showSessionExpiredToast } from "./sessionExpiredToast";

function extractHttpStatus(err: any): number | undefined {
  const direct =
    err?.response?.status ?? err?.status ?? err?.response?.data?.statusCode;

  if (typeof direct === "number" && !Number.isNaN(direct)) {
    return direct;
  }

  const message = String(err?.message ?? "");
  const statusMatch = message.match(/status code (\d{3})/i);
  if (statusMatch) {
    return Number(statusMatch[1]);
  }

  return undefined;
}

const isUnauthorizedError = (err: any): boolean => extractHttpStatus(err) === 401;

export const isAxiosNetworkError = (err: any): boolean => {
  if (!err || err.response) {
    return false;
  }

  const code = String(err.code ?? "").toUpperCase();
  const message = String(err.message ?? "").trim().toLowerCase();

  if (code === "ERR_CANCELED" || code === "CANCELEDERROR") {
    return false;
  }

  return (
    code === "ERR_NETWORK" ||
    code === "ECONNABORTED" ||
    code === "ERR_CONNECTION_REFUSED" ||
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    message === "network error" ||
    message.includes("network request failed") ||
    message.includes("failed to connect") ||
    message.includes("internet connection appears to be offline")
  );
};

export const getAxiosErrorMessage = (
  err: any,
  fallback = "Неизвестная ошибка",
): string => {
  if (isUnauthorizedError(err)) {
    return SESSION_EXPIRED_MESSAGE;
  }

  if (isAxiosNetworkError(err)) {
    return NETWORK_ERROR_MESSAGE;
  }

  const errorData = err?.response?.data;

  if (typeof errorData === "string" && errorData.trim()) {
    return errorData.trim();
  }

  if (errorData && typeof errorData === "object") {
    if (typeof errorData.message === "string" && errorData.message.trim()) {
      return errorData.message.trim();
    }

    if (typeof errorData.message === "object" && errorData.message !== null) {
      const messages = collectStringMessages(errorData.message);
      if (messages.length > 0) {
        return messages.join(". ");
      }
    }

    if (typeof errorData.detail === "string" && errorData.detail.trim()) {
      return errorData.detail.trim();
    }

    if (typeof errorData.title === "string" && errorData.title.trim()) {
      return errorData.title.trim();
    }

    if (typeof errorData.error === "string" && errorData.error.trim()) {
      return errorData.error.trim();
    }

    if (errorData.errors) {
      const messages = collectStringMessages(errorData.errors);
      if (messages.length > 0) {
        return messages.join(". ");
      }
    }
  }

  if (typeof err?.message === "string" && err.message.trim()) {
    const message = err.message.trim();
    if (/^network error$/i.test(message)) {
      return NETWORK_ERROR_MESSAGE;
    }
    if (!/^Request failed with status code \d+$/i.test(message)) {
      return message;
    }
  }

  return fallback;
};
  
  export const axiosErrorHandler = (err: any) => {
    try {
      if (!err) return;

      console.error("Axios error:", err);

      if (isUnauthorizedError(err)) {
        showSessionExpiredToast();
        return;
      }

      const errorMessage = getAxiosErrorMessage(err);
      if (errorMessage === SESSION_EXPIRED_MESSAGE) {
        showSessionExpiredToast();
        return;
      }

      showAppToast({
        type: "error",
        text1: errorMessage,
      });
      // Открываем уведомление
    //   openNotification({
    //     type: "error",
    //     text: notificationText,
    //   });
      
    } catch (error) {
      console.error('Error in axiosErrorHandler:', error);
      showAppToast({
        type: "error",
        text1: "Произошла непредвиденная ошибка",
      });
      
      // Фолбэк на случай ошибки в обработчике ошибок
    //   openNotification({
    //     type: "error",
    //     text: "Произошла непредвиденная ошибка",
    //   });
    }
  };
  
  const queryToString = (query: object) => {
    let keys: string = "?";
    const queryLength = Object.keys(query)?.length || 0;
    Object.keys(query).forEach((key: string, index: number) => {
      if (query[key as keyof object] !== undefined) {
        keys =
          keys +
          `${key}=${query[key as keyof object]}${
            index + 1 < queryLength ? "&" : ""
          }`;
      }
    });
  
    if (keys.endsWith("&") || keys.endsWith("?")) {
      keys = keys.slice(0, -1);
    }
    return keys;
  };
  

  
  const getActualUrl = (url: string) => {
    console.log(url)
    return url;
  };
  
  const api = {
    admin: {
      getFile: (url: string, query?: any) => {
        if (query) {
          return ax.get(getActualUrl(url) + queryToString(query));
        }
        return ax.get(getActualUrl(url), {
          headers: {
            Accept:
              "*/*",
          },
          responseType: "arraybuffer",
        });
      },
      get: (url: string, query?: any) => {
        if (query) {
          return ax.get(getActualUrl(url) + queryToString(query));
        }
        return ax.get(getActualUrl(url));
      },
      post: (url: string, body: any) => {
        return ax.post(getActualUrl(url), body);
      },
      put: (url: string, body: any) => {
        return ax.put(getActualUrl(url), body);
      },
      patch: (url: string, query?: any) => {
        if (query) {
          return ax.patch(getActualUrl(url), query);
        }
        return ax.patch(getActualUrl(url));
      },
      delete: (url: string, query?: any) => {
        if (query) {
          return ax.delete(getActualUrl(url) + queryToString(query));
        }
        return ax.delete(getActualUrl(url));
      },
    },
  };
  
  export default api;
  