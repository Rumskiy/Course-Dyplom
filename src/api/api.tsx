import axios from "axios";

export const ApiToken = 'http://127.0.0.1:8000/api'

export function getToken(): string {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo).token : '';
}

export const apiClient = axios.create({
    baseURL: ApiToken,
    headers: {
        Accept: 'application/json',
        // не вказуємо Authorization тут
    },
});

apiClient.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers = config.headers ?? {};
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});
