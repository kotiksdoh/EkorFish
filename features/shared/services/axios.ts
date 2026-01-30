import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// export const baseUrl = `http://192.168.222.205:9191`; // Локалка
// export const baseUrl = `http://192.168.222.239:13333`;
// export const baseUrl = `http://46.29.13.61:13333`;
export const baseUrl = `http://192.168.222.238:13333`; // Сервер
// 192.168.222.239:13333/swagger/index.html

  export const ax = axios.create();

  ax.defaults.baseURL = baseUrl;

  ax.interceptors.request.use(async (config) => {
    config.headers["Content-Type"] = "application/json";
    // config.headers["Authorization"] = `Bearer ${localStorage.getItem('token')}`;
    return config;
  });
  ax.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        // console.log(window.location.href)
        const href = window.location.href.split('/')[window.location.href.split('/').length - 1]
        if (error.response && error.response.status === 401 && !originalRequest._retry && href !== 'auth') {
            debugger
            originalRequest._retry = true;
            try {
                debugger
                // const { data } = await axios.post(`${baseUrl}/users/refresh_token`, null, {
                //     headers: {
                //         'Authorization': `Bearer ${localStorage.getItem('token_refresh')}`,
                //     }
                // });
                debugger
                // localStorage.setItem('token', data.access_token)
                // localStorage.setItem('token_refresh', data.refresh_token)
                return ax(originalRequest);
            } catch (err) {
                debugger
                // localStorage.removeItem('token')
                // localStorage.removeItem('token_refresh')
                // localStorage.removeItem('user')
                // AsyncStorage.removeItem('token')
                // AsyncStorage.removeItem('token_refresh')
                // AsyncStorage.removeItem('user')
                debugger
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

export const axdef = axios.create();
axdef.defaults.baseURL = baseUrl;

axdef.interceptors.request.use(async (config) => {
  config.headers["Content-Type"] = "application/json";
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting token from AsyncStorage:', error);
  }
  return config;
});

axdef.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('token_refresh');
        const { data } = await axios.post(`${baseUrl}/api/Account/refresh-token`, 
          { refresh_token: refreshToken });
        
        await AsyncStorage.setItem('token', data.access_token);
        await AsyncStorage.setItem('token_refresh', data.refresh_token);
        
        // Обновляем заголовок для повторного запроса
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return axdef(originalRequest);
      } catch (err) {
        // Очищаем хранилище при ошибке
        await AsyncStorage.multiRemove(['token', 'token_refresh', 'user']);
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);