import axios from "axios";
import {ApiToken, token} from "../api.tsx";
import {UpdateData} from "../../model.tsx";



export const AccountSettings = async () => {
    try {
        const response = await axios.get(`${ApiToken}/account`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error("Error data:", error);
        throw error;
    }
}

export const AccountSettingsSave = async (accountDataSave: UpdateData) => {
    try {
        const response = await axios.put(`${ApiToken}/account`, accountDataSave, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        return response.data;
    } catch (error) {
        console.error("Error data:", error);
        throw error;
    }
}