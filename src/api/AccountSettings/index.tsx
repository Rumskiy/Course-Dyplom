import {apiClient} from "../api.tsx";
import {UpdateData} from "../../model.tsx";

export type AccountData = {
    // тут опиши всі поля, які приходять з /account,
    // наприклад:
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    // …та інші
}

export const AccountSettings = async (): Promise<AccountData> => {
    const { data } = await apiClient.get<{ data: AccountData }>('/account');
    return data.data;
};

export const AccountSettingsSave= async (
    accountData: UpdateData
): Promise<AccountData> => {
    const { data } = await apiClient.post<{ data: AccountData }>(
        '/account',
        accountData
    );
    return data.data;
};