import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export const baseUrl = `http://192.168.222.205:9191`; // Локалка
// export const baseUrl = `http://192.168.222.239:13333`;
// export const baseUrl = `http://46.29.13.61:13333`;
// export const baseUrl = `http://192.168.222.238:13333`; // Сервер
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
        console.log('error.response', error.response)
        if (error.response && error.response.status === 401 && !originalRequest._retry && href !== 'auth') {
            originalRequest._retry = true;
            try {
                const { data } = await axios.post(`${baseUrl}/api/Account/refresh-token`, null, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token_refresh')}`,
                    }
                });
                await AsyncStorage.setItem('token', data.access_token)
                await AsyncStorage.setItem('token_refresh', data.refresh_token)
                return ax(originalRequest);
            } catch (err) {
                // localStorage.removeItem('token')
                // localStorage.removeItem('token_refresh')
                // localStorage.removeItem('user')
                // AsyncStorage.removeItem('token')
                // AsyncStorage.removeItem('token_refresh')
                // AsyncStorage.removeItem('user')
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
    console.log('Full error in interceptor:', error);
    console.log('Has response?:', !!error.response);
    console.log('Status:', error.response?.status);
    
    // Проверяем Network Error - это может быть скрытый 401 из-за CORS
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.log('Network Error detected - could be CORS issue');
      
      // Пытаемся обновить токен на всякий случай
      try {
        const refreshToken = await AsyncStorage.getItem('token_refresh');
        const { data } = await axios.post(`${baseUrl}/api/Account/refresh-token`, 
          { RefreshToken: refreshToken });
        console.log(data)
        await AsyncStorage.setItem('token', data.data.accessToken);
        await AsyncStorage.setItem('token_refresh', data.data.refreshToken);
        
        // Обновляем заголовок по умолчанию
        axdef.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`;
        
        // Пробуем снова тот же запрос
        if (error.config && !error.config._retry) {
          error.config._retry = true;
          error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return axdef(error.config);
        }
      } catch (refreshError) {
        console.log('Refresh failed:', refreshError);
        await AsyncStorage.multiRemove(['token', 'token_refresh', 'user']);
      }
    }
    
    // Оригинальная логика для обычного 401
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('token_refresh');
        const { data } = await axios.post(`${baseUrl}/api/Account/refresh-token`, 
          { refreshToken: refreshToken });
        
        await AsyncStorage.setItem('token', data.data.accessToken);
        await AsyncStorage.setItem('token_refresh', data.data.refreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return axdef(originalRequest);
      } catch (err) {
        await AsyncStorage.multiRemove(['token', 'token_refresh', 'user']);
        return Promise.reject(err);
      }
    }
    
    return Promise.reject(error);
  }
);