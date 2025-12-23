// import { openNotification } from "../helpers/notifications";
import { Toast } from "toastify-react-native";
import {
    ax,
} from "./axios";
  
  export const axiosErrorHandler = (err: any) => {
    try {
      // Логируем ошибку для отладки
      console.error('Axios error:', err);
      
      // Получаем данные ошибки
      const errorData = err?.response?.data;
      const statusCode = err?.response?.status || err?.code || err?.status;
      
      let errorMessage = 'Неизвестная ошибка';
      
      // Обработка различных форматов сообщений об ошибках
      if (errorData) {
        // Случай 1: message - строка
        if (typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        }
        // Случай 2: message - объект с ключами (как в вашем примере)
        else if (typeof errorData.message === 'object' && errorData.message !== null) {
          // Получаем все строковые значения из объекта
          const messages = Object.values(errorData.message)
            .filter(msg => typeof msg === 'string')
            .map((msg: any) => msg.trim())
            .filter(msg => msg.length > 0);
          
          errorMessage = messages.length > 0 
            ? messages.join('. ') 
            : 'Ошибка в данных';
        }
        // Случай 3: error - строка
        else if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        }
        // Случай 4: errors - объект или массив
        else if (errorData.errors) {
          if (typeof errorData.errors === 'object') {
            const errorMessages = Object.values(errorData.errors)
              .flatMap(value => {
                if (typeof value === 'string') return [value];
                if (Array.isArray(value)) return value.filter(v => typeof v === 'string');
                return [];
              })
              .filter(msg => msg.trim().length > 0);
            
            errorMessage = errorMessages.length > 0 
              ? errorMessages.join('. ') 
              : 'Ошибка валидации';
          } else if (Array.isArray(errorData.errors)) {
            const validMessages = errorData.errors
              .filter((msg: any) => typeof msg === 'string')
              .map((msg: any) => msg.trim())
              .filter((msg: any) => msg.length > 0);
            
            errorMessage = validMessages.length > 0 
              ? validMessages.join('. ') 
              : 'Ошибка валидации';
          }
        }
      }
      
      // Если сообщение не найдено в данных, пробуем другие источники
      if (errorMessage === 'Неизвестная ошибка') {
        errorMessage = err?.message || 'Неизвестная ошибка';
      }
      
      // Формируем текст уведомления
      let notificationText = errorMessage;
      
      // Добавляем код ошибки, если есть
      if (statusCode) {
        notificationText = `Код ошибки: ${statusCode}. ${errorMessage}`;
      }
      Toast.error(notificationText)
      // Открываем уведомление
    //   openNotification({
    //     type: "error",
    //     text: notificationText,
    //   });
      
    } catch (error) {
      console.error('Error in axiosErrorHandler:', error);
      Toast.error('Произошла непредвиденная ошибка')
      
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
  