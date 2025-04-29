import axios, {AxiosError} from "axios";
import {UserLogin} from "../../model.tsx";
import { ApiToken } from "../api.tsx";

export const LoginApi = async (user: UserLogin) => {
    try {
        const response = await axios.post(ApiToken + "/authenticate", {
            email: user.email,
            password: user.password,
        });
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        throw axiosError.message || "Login failed!";
    }
};
