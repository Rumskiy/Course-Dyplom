import axios from "axios";
import { ApiToken } from "../api.tsx";
import {RegisterUser} from "../../model.tsx";

export const RegisterPost = (props: RegisterUser) => {
    return axios.post(ApiToken + "/register", props);
};
