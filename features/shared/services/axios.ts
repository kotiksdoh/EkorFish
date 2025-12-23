import axios from "axios";

export const baseUrl = `http://192.168.222.229:9191`;
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
                localStorage.removeItem('token')
                localStorage.removeItem('token_refresh')
                localStorage.removeItem('user')
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
    config.headers["Authorization"] = `Bearer ${localStorage.getItem('token')}`;
    return config;
  });
  axdef.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        const href = window.location.href.split('/')[window.location.href.split('/').length - 1]
        if (error.response && error.response.status === 401 && !originalRequest._retry && href !== 'auth') {
            originalRequest._retry = true;
            try {
                const { data } = await axios.post(`${baseUrl}/api/Account/refresh-token`, 
                  {refresh_token: localStorage.getItem('token_refresh')});
                localStorage.setItem('token', data.access_token)
                localStorage.setItem('token_refresh', data.refresh_token)
                return ax(originalRequest);
            } catch (err) {
                localStorage.removeItem('token')
                localStorage.removeItem('token_refresh')
                localStorage.removeItem('user')
                // 
                // window.location.href = '/login';
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);