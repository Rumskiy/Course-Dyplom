import {apiClient} from "../api.tsx";
import {QuizResultPayload} from "../../model.tsx";

export const getTest = async (id: string) => {
    try {
        const response = await apiClient.get(`/tests/${id}`);
        return response.data;
    }catch(error) {
        console.error(error || 'Error getting test');
    }
}

export const submitQuizResult  = async (payload: QuizResultPayload) => {
    try {
        const response = await apiClient.post('/quiz/attempts', payload); // Використовуємо новий маршрут
        return response.data; // Повертаємо відповідь (наприклад, 'message')
    }catch(error) {
        console.error('Error creating test:', error);
    }
}

export const getTestBySectionId = async (id: number | string) => {
    try {
        const response = await apiClient.get(`courses/section/tests/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error creating test:', error);
        throw error;
    }
};

export const createTest = async (props: any) => {
    try {
        const response = await apiClient.post('courses/section/tests', props);
        return response.status === 201 ? response.data : null;
    } catch (error) {
        console.error('Error creating test:', error);
        throw error;
    }
};

export const updateTest = async (id: string, props: any) => {
    try {
        const response = await apiClient.post(`courses/section/tests/${id}`, props);
        return response.status === 201 ? response.data : null;
    } catch (error) {
        console.error('Error creating test:', error);
        throw error;
    }
};
