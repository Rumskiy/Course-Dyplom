import { apiClient } from "../api";

export const getQuizAttempts = async () => {
    const response = await apiClient.get(`/quiz/attempts`);
    return response.data.data;
};