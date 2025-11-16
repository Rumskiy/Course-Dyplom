import { apiClient } from "../api";
import {AxiosError} from "axios";

export const getQuizAttempts = async () => {
    const response = await apiClient.get(`/quiz/attempts/by-course`);
    return response.data.data;
};

export const getSertificate = async (courseId: number): Promise<void> => {
    try {
        const response = await apiClient.get(`/courses/${courseId}/certificate`, {
            responseType: 'blob', // ВАЖЛИВО: очікуємо бінарні дані (PDF)
        });

        // Створення URL для blob об'єкта
        const fileURL = window.URL.createObjectURL(new Blob([response.data]));
        // Створення тимчасового посилання для завантаження
        const fileLink = document.createElement('a');

        fileLink.href = fileURL;

        // Визначення імені файлу (можна отримати з заголовків відповіді, якщо бекенд їх надсилає)
        // Content-Disposition: attachment; filename="certificate-course-title-123.pdf"
        const contentDisposition = response.headers['content-disposition'];
        let fileName = `certificate-course-${courseId}.pdf`; // За замовчуванням
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
            if (fileNameMatch && fileNameMatch.length === 2)
                fileName = fileNameMatch[1];
        }

        fileLink.setAttribute('download', fileName);
        document.body.appendChild(fileLink);

        fileLink.click(); // Імітація кліку для завантаження

        // Очищення
        document.body.removeChild(fileLink);
        window.URL.revokeObjectURL(fileURL);

    } catch (error) {
        const axiosError = error as AxiosError;
        // Якщо бекенд повертає JSON з помилкою (наприклад, статус 403 Forbidden)
        if (axiosError.response && axiosError.response.data && axiosError.response.data instanceof Blob && axiosError.response.data.type === "application/json") {
            // Спроба прочитати Blob як JSON
            const errorJson = await axiosError.response.data.text();
            try {
                const parsedError = JSON.parse(errorJson);
                console.error("Certificate generation failed:", parsedError.message || parsedError.reason);
                throw new Error(parsedError.message || parsedError.reason || 'Не вдалося згенерувати сертифікат.');
            } catch (parseErr) {
                console.error("Error parsing error blob:", parseErr);
                throw new Error('Не вдалося згенерувати сертифікат. Невідома помилка сервера.');
            }
        } else if (axiosError.response) {
            // Інші помилки сервера (наприклад, 500)
            console.error("Server error while fetching certificate:", axiosError.response.status, axiosError.response.data);
            throw new Error(`Помилка сервера (${axiosError.response.status}) при генерації сертифікату.`);
        } else {
            // Помилки мережі або інші
            console.error("Network or other error while fetching certificate:", axiosError.message);
            throw new Error(axiosError.message || 'Помилка мережі або не вдалося згенерувати сертифікат.');
        }
    }
};