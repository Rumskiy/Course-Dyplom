import axios from "axios";
import {ApiToken} from "../api.tsx";

export const CategoryGet = async () => {
    const response = await axios.get(`${ApiToken}/categories`);
    return response.data;
};





