import axios from "axios";

export const ApiToken = 'http://127.0.0.1:8000/api'

const getToken = () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo).token : '';
};

// @ts-ignore
export const token = getToken();


export const apiClient = axios.create({
    baseURL: ApiToken,
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

