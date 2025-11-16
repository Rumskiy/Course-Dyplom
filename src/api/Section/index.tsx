import { apiClient } from "../api";
import {Section} from "../../model.tsx";


export const getSections = async (id: string) => {
    const response = await apiClient.get(`/courses/${id}/sections/`);
    return response.data;
};

export const getSectionsById = async (id: string): Promise<Section> => {
    const { data } = await apiClient.get<Section>(`/courses/sections/${id}`);
    return data;
};

export const createSectionApi = async (formData: any) => {
    const response = await apiClient.post('/courses/sections', formData, { // Надсилаємо на ендпоінт створення
        headers: {
            'Content-Type': 'multipart/form-data', // Важливо для FormData
        },
    });
    return response.status === 201 ? response.data : null;
};

export const updateSectionApi = async (id: string, formData: any) => {
    const response = await apiClient.post(`/courses/sections/${id}`, formData, { // Надсилаємо на ендпоінт створення
        headers: {
            'Content-Type': 'multipart/form-data', // Важливо для FormData
        },
    });
    return response.status === 201 ? response.data : null;
};

export const DeleteSection = async (id: string) => {
    return await apiClient.delete(`/courses/sections/${id}`);
};