import axios from "axios";
import {ApiToken, token} from "../api.tsx";
import {UpdateData} from "../../model.tsx";



export const AccountSettings = async () => {
    // 1) Read userInfo from localStorage
    const raw = localStorage.getItem('userInfo');
    const { token } = raw ? JSON.parse(raw) : { token: '' };

    if (!token) {
        throw new Error('No auth token found');
    }

    // 2) Attach Bearer header on every call
    const response = await axios.get(`${ApiToken}/account`, {
        headers: {
            Authorization: `Bearer ${token}`
        },
    });

    return response.data.data;
};

export const AccountSettingsSave = async (accountDataSave: UpdateData) => {
    try {
        const response = await axios.post(`${ApiToken}/account`, accountDataSave, {
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